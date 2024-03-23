require('dotenv').config();
const mysql = require('mysql2');

// Use createPool instead of createConnection for better performance and automatic handling of connections
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Use pool's promise wrapper for async/await support
const promisePool = pool.promise();

// Simplified query function using async/await
async function query(sql, params) {
    try {
        const [results, ] = await promisePool.query(sql, params);
        return results;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error; // Rethrow the error to be caught by the caller
    }
}

module.exports = { query };
