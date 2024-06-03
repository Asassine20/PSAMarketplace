// src/pages/api/login.js
import jwt from 'jsonwebtoken';
import { query } from '@/db';
import bcrypt from 'bcrypt';
import cookie from 'cookie';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { email, password } = req.body;

  try {
    const [user] = await query('SELECT * FROM Users WHERE Email = ?', [email]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userId = user.UserID;
    const accessToken = jwt.sign({ userId, email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId, email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    const sessionId = uuidv4();
    await query('INSERT INTO UserSessions (SessionID, UserID) VALUES (?, ?)', [sessionId, userId]);

    res.setHeader('Set-Cookie', cookie.serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'strict',
      path: '/'
    }));

    res.status(200).json({ userId, accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server error' });
  }
}
