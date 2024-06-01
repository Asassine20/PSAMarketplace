import { query } from '@/db';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const cookies = cookie.parse(req.headers.cookie || '');
  const sessionId = cookies.sessionId;

  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID missing' });
  }

  try {
    await query('DELETE FROM UserSessions WHERE SessionID = ?', [sessionId]);

    res.setHeader('Set-Cookie', cookie.serialize('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 0, // Expire the cookie
      sameSite: 'strict',
      path: '/'
    }));

    res.status(200).json({ message: 'Session deleted' });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: 'Server error' });
  }
}
