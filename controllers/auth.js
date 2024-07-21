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
    const { email, password, passwordConfirm } = req.body;

    connection.query('SELECT Email, IsSeller FROM Users WHERE Email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Database error');
        }
        if (results.length > 0) {
            if (!results[0].IsSeller) {
                // User has not completed seller info, redirect to complete it
                const encodedEmail = encodeURIComponent(email);
                return res.redirect(`/register/seller-info?email=${encodedEmail}`);
            } else {
                // Email has already been fully registered
                return res.render('register', {
                    message: 'That email has already been registered'
                });
            }
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        connection.query('INSERT INTO Users (Email, PasswordHash, IsSeller) VALUES (?, ?, FALSE)', [email, hashedPassword], (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Database insert error');
            }
            const encodedEmail = encodeURIComponent(email);
            req.session.email = email; // Store the email in the session
            return res.redirect(`/register/seller-info?email=${encodedEmail}`);
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

                            // Update IsSeller to true
                            conn.query('UPDATE Users SET IsSeller = 1 WHERE UserID = ?', [userID], (error) => {
                                if (error) {
                                    conn.rollback(() => conn.release());
                                    return res.status(500).send('Error updating user seller status.');
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
                                            res.redirect('/final-verification'); // Proceed with the redirection even if email fails
                                        });
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

    const query = `
        SELECT Users.UserID, Users.PasswordHash, Users.IsSeller 
        FROM Users
        WHERE Users.Email = ?
    `;

    connection.query(query, [email], async (error, results) => {
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

        if (!results[0].IsSeller) {
            // User has not completed seller info
            return res.redirect(`/register/seller-info?email=${encodeURIComponent(email)}`);
        }

        const user = {
            id: results[0].UserID,
            isSeller: results[0].IsSeller
        };

        // Create Access Token
        const accessToken = jwt.sign(user, process.env.JWT_SECRET, {
            expiresIn: '15m'  // e.g., 15 minutes
        });

        // Create Refresh Token
        const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '30d'  // e.g., 30 days
        });

        // Send tokens to client
        res.cookie('jwt', accessToken, { httpOnly: true, maxAge: 900000 }); // 15 minutes
        res.cookie('refreshJwt', refreshToken, { httpOnly: true, maxAge: 2592000000 }); // 30 days

        res.status(200).redirect("/admin/dashboard");
    });
};

exports.refreshToken = (req, res) => {
    const refreshToken = req.cookies.refreshJwt;
    if (!refreshToken) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = {
            id: decoded.id,
            storeName: decoded.storeName
        };

        const newAccessToken = jwt.sign(user, process.env.JWT_SECRET, {
            expiresIn: '15m'
        });

        res.cookie('jwt', newAccessToken, { httpOnly: true, maxAge: 900000 }); // 15 minutes
        res.status(200).json({ message: "Token refreshed" });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.redirect('/login');
    }
};
