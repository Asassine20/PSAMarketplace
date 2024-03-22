// Next.js API route for fetching distinct sports
import db from '@/db';

export default async function handler(req, res) {
  try {
    const [rows, fields] = await db.query('SELECT DISTINCT Sport FROM Card');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).send('Server error');
  }
}

