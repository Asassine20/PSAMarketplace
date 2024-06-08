import db from '@/db';

export default async function handler(req, res) {
  try {
    const results = await db.query('SELECT DISTINCT Sport FROM Card');
    const sports = results.map(row => ({ Sport: row.Sport }));
    res.status(200).json(sports);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).send('Server error');
  }
}
