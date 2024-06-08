import db from '@/db';

export default async function handler(req, res) {
  const { sport } = req.query;

  if (!sport) {
    return res.status(400).json({ error: 'Sport is required' });
  }

  try {
    const results = await db.query(
      `SELECT CardSet 
       FROM (
         SELECT CardSet, MAX(CardID) AS MaxCardID
         FROM Card
         WHERE Sport = ?
         GROUP BY CardSet
         ORDER BY MaxCardID DESC
         LIMIT 10
       ) AS recentCardSets`,
      [sport]
    );
    
    const cardSets = results.map(row => ({ CardSet: row.CardSet }));
    res.status(200).json(cardSets);
  } catch (error) {
    console.error('Error fetching card sets:', error);
    res.status(500).send('Server error');
  }
}
