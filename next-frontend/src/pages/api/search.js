// pages/api/search.js
import db from '@/db'; // Ensure this path matches your db module's actual location

export default async function handler(req, res) {
  const { cardName } = req.query;

  try {
    const query = `
      SELECT * FROM Card
      WHERE CardName LIKE ?
    `;
    const values = [`%${cardName}%`];

    const [rows] = await db.query(query, values);
    console.log(rows);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Failed to fetch cards:", error);
    res.status(500).json({ message: "Failed to fetch cards" });
  }
}
