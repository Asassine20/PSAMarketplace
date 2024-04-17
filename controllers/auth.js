const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendConfirmationEmail } = require('./email'); // Adjust the path according to your project structure


const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

exports.register = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;
    connection.query('SELECT Email FROM Users WHERE Email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }
        if (results.length > 0) {
            return res.render('register', {
                message: 'That email has already been registered'
            });
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
                const encodedEmail = encodeURIComponent(email);
                req.session.email = email; // Store the email in the session
                return res.redirect(`/register/seller-info?email=${encodedEmail}`);
            }
        });
    });
};

exports.submitSellerInfo = (req, res) => {
    const email = req.body.email || req.session.email;

    if (!email || email.trim() === '') {
        return res.render('seller-info', {
            message: 'Email is required.',
            formData: req.body
        });
    }

    const { firstName, lastName, street, street2, city, state, zip, country, storeName, accountType, accountName, routingNumber, accountNumber, confirmRoutingNumber, confirmAccountNumber } = req.body;
    if (routingNumber.length !== 9) {
        return res.render('seller-info', {
            message: 'Routing number must be 9 numbers long.',
            formData: req.body
        });
    }
    if (routingNumber !== confirmRoutingNumber) {
        return res.render('seller-info', {
            message: 'Routing numbers do not match.',
            formData: req.body
        });
    }
    if (accountNumber !== confirmAccountNumber) {
        return res.render('seller-info', {
            message: 'Account numbers do not match.',
            formData: req.body
        });
    }

    connection.getConnection((err, conn) => {
        if (err) {
            console.error('Error obtaining connection:', err);
            return res.status(500).send('Server error while obtaining connection.');
        }

        conn.beginTransaction(err => {
            if (err) {
                console.error('Error starting transaction:', err);
                conn.release();
                return res.status(500).send('Server error while starting transaction.');
            }

            conn.query('SELECT UserID FROM Users WHERE Email = ?', [email], (error, results) => {
                if (error || results.length === 0) {
                    conn.rollback(() => conn.release());
                    return res.status(500).send('Server error or user not found.');
                }

                const userID = results[0].UserID;
                const addressData = { Street: street, Street2: street2, City: city, State: state, ZipCode: zip, Country: country, IsPrimary: true, UserID: userID };

                // Insert address data
                conn.query('INSERT INTO Addresses SET ?', addressData, (error) => {
                    if (error) {
                        conn.rollback(() => conn.release());
                        return res.status(500).send('Error inserting address.');
                    }

                    const storeData = { UserID: userID, StoreName: storeName, Description: '' };

                    // Insert store data
                    conn.query('INSERT INTO Stores SET ?', storeData, (error, storeResults) => {
                        if (error) {
                            conn.rollback(() => conn.release());
                            return res.status(500).send('Error inserting store.');
                        }

                        const bankInfoData = { StoreID: storeResults.insertId, AccountType: accountType, AccountName: accountName, RoutingNumber: routingNumber, AccountNumber: accountNumber };

                        // Insert bank info data
                        conn.query('INSERT INTO BankInfo SET ?', bankInfoData, (error) => {
                            if (error) {
                                conn.rollback(() => conn.release());
                                return res.status(500).send('Error inserting bank info.');
                            }

                            // Commit transaction
                            conn.commit(err => {
                                if (err) {
                                    conn.rollback(() => conn.release());
                                    return res.status(500).send('Error committing transaction.');
                                }

                                conn.release(); // Release connection back to the pool

                                // Send confirmation email
                                const user = { id: userID, email };
                                sendConfirmationEmail(user)
                                    .then(() => {
                                        console.log('Confirmation email sent successfully.');
                                        res.redirect('/final-verification');
                                    })
                                    .catch(sendEmailError => {
                                        console.error('Error sending confirmation email:', sendEmailError);
                                        // Decide how you want to handle email sending failures
                                        res.redirect('/final-verification'); // Proceed with the redirection even if email fails
                                    });
                            });
                        });
                    });
                });
            });
        });
    });
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
