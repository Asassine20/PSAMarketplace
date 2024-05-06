import { query } from '@/db';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { email, password, passwordConfirm } = req.body;

  try {
    // Check if email exists
    const emailCheckSql = 'SELECT Email FROM Users WHERE Email = ?';
    const emailResults = await query(emailCheckSql, [email]);
    
    if (emailResults.length > 0) {
      res.status(409).json({ message: 'That email has already been registered' });
      return;
    }

    if (password !== passwordConfirm) {
      res.status(400).json({ message: 'Passwords do not match' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Insert user into database
    const insertSql = 'INSERT INTO Users SET ?';
    await query(insertSql, { Email: email, PasswordHash: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
