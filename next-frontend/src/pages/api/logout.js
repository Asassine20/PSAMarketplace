import { query } from '@/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { sessionId } = req.body;

  try {
    await query('DELETE FROM UserSessions WHERE SessionID = ?', [sessionId]);
    res.status(200).json({ message: 'Session deleted' });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: 'Server error' });
  }
}
