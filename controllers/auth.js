const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const connection = mysql.createPool({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database :process.env.DB_DATABASE
});


exports.register =  (req, res) => {
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
        connection.query('INSERT INTO Users SET ?',  {Username: name, Email: email, PasswordHash: hashedPassword}, (error, results) => {
            if (error) {
                console.log(error);
            } else {
            return res.render('register', {
                message: 'User registered'
            });
            }
        })
    });
}

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

        // Correctly reference the UserID from the query results
        const id = results[0].UserID;
        const username = results[0].Username; // Fetch the username
        const token = jwt.sign({ id, username }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
        // Set the token in a cookie and redirect to the dashboard
        res.cookie('jwt', token, { httpOnly: true, maxAge: 7200000 });
        res.status(200).redirect("/admin/dashboard");
        
        console.log("The token is: " + token);
        
    });
};
