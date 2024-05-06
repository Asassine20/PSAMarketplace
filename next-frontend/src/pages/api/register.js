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
    // Check if email exists and check the IsSeller and IsBuyer statuses
    const emailCheckSql = 'SELECT Email, IsSeller, IsBuyer FROM Users WHERE Email = ?';
    const emailResults = await query(emailCheckSql, [email]);
    
    // Allow registration if email is taken but IsSeller is true, and handle IsBuyer condition
    if (emailResults.length > 0) {
      if (emailResults[0].IsBuyer === 1) {
        res.status(409).json({ message: 'That email has already been registered.' });
        return;
      } else if (emailResults[0].IsSeller === 0) {
        res.status(409).json({ message: 'That email has already been registered and cannot be used for a new registration.' });
        return;
      }
    }

    if (password !== passwordConfirm) {
      res.status(400).json({ message: 'Passwords do not match' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 8);

    // Insert or update user into database depending on IsSeller status
    const insertOrUpdateSql = emailResults.length > 0 ?
      'UPDATE Users SET PasswordHash = ?, IsBuyer = 1 WHERE Email = ?' :
      'INSERT INTO Users (Email, PasswordHash, IsBuyer) VALUES (?, ?, 1)';
    const params = emailResults.length > 0 ? [hashedPassword, email] : [email, hashedPassword];
    await query(insertOrUpdateSql, params);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
