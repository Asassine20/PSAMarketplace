require('dotenv').config();
const mysql = require('mysql');

const connection = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    charset : 'utf8mb4'
});



connection.connect((err) => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database as ID ' + connection.threadId);
});

const query = (sql, params) => new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
        if (error) {
            reject(error);
        }
        resolve(results);
    });
});


module.exports = { query };
