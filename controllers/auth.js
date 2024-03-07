const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, password, passwordConfirm } = req.body;

    connection.query('SELECT Email FROM Users WHERE Email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }

        if (results.length > 0) {
            return res.render('register', {
                message: 'That email has already been registered'
            })
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);
        connection.query('INSERT INTO Users SET ?', { Username: name, Email: email, PasswordHash: hashedPassword }, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                return res.redirect('/register/seller-info');
            }
        })
    });
};

exports.submitSellerInfo = (req, res) => {
    const { street, street2, city, state, zip, country, storeName, accountType, accountName, routingNumber, accountNumber } = req.body;
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).render('seller-info', {
            message: 'You need to be logged in to submit this information.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userID = decoded.id;

        connection.query('SELECT StoreName FROM Stores WHERE StoreName = ?', [storeName], async (error, results) => {
            if (error) {
                console.log(error);
                return res.render('seller-info', {
                    message: 'An error occurred while checking the store name'
                });
            }

            if (results.length > 0) {
                return res.render('seller-info', {
                    message: 'This store name is already registered. Please choose a different name.'
                });
            } else {
                connection.query('INSERT INTO Stores SET ?', { UserID: userID, StoreName: storeName, Description: '' }, (error, storeResults) => {
                    if (error) {
                        console.log(error);
                        return res.render('seller-info', {
                            message: 'An error occurred while saving store information'
                        });
                    } else {
                        const storeID = storeResults.insertId;
                        connection.query('INSERT INTO Addresses SET ?', {
                            UserID: userID, Street: street, City: city, State: state, ZipCode: zip, Country: country, Street2: street2
                        }, (addressError) => {
                            if (addressError) {
                                console.log(addressError);
                                return res.render('seller-info', {
                                    message: 'An error occurred while saving address information'
                                });
                            } else {
                                connection.query('INSERT INTO BankInfo SET ?', {
                                    StoreID: storeID, AccountType: accountType, AccountName: accountName, RoutingNumber: routingNumber, AccountNumber: accountNumber
                                }, (bankInfoError) => {
                                    if (bankInfoError) {
                                        console.log(bankInfoError);
                                        return res.render('seller-info', {
                                            message: 'An error occurred while saving bank information'
                                        });
                                    } else {
                                        return res.redirect('/final-verification');
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(403).render('seller-info', {
            message: 'Invalid token. Please log in again.'
        });
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    connection.query('SELECT * FROM Users WHERE Email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).render('login', {
                message: 'Server error'
            });
        }

        if (results.length == 0 || !(await bcrypt.compare(password, results[0].PasswordHash))) {
            return res.status(401).render('login', {
                message: 'Email or Password is incorrect'
            });
        }

        const id = results[0].UserID;
        const username = results[0].Username;
        const token = jwt.sign({ id, username }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.cookie('jwt', token, { httpOnly: true, maxAge: 7200000 });
        res.status(200).redirect("/admin/dashboard");

        console.log("The token is: " + token);
    });
};
