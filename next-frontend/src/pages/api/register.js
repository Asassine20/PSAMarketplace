// pages/api/register.js
const { query } = require('@/db');  // Correctly import the query function from your database module

export default function handler(req, res) {
  const { username, password } = req.body;  // Get username and password from submitted form data
  
  if (req.method === 'POST') {
    const sql = 'INSERT INTO Users (Username, Email, Password) VALUES (?, ?, ?)';
    query(sql, [username, password], (err, result) => {  // Use 'query' directly instead of 'db.query'
      if (err) {
        console.error("Error inserting record:", err);
        res.status(500).json({ message: 'Database error' });
        return;
      }
      console.log('1 record inserted');
      res.status(200).json({ message: 'User Created Successfully' });
    });
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
