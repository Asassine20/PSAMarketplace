// Next.js API route for fetching distinct sports
import db from '@/db';

export default async function handler(req, res) {
  try {
    const results = await db.query('SELECT DISTINCT Sport FROM Card');
    // Assuming results are in an array and need to be mapped to the expected structure
    const sports = results.map(row => ({ Sport: row.Sport }));
    console.log('Sports fetched from the database:', sports);
    res.status(200).json(sports);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).send('Server error');
  }
}
