// pages/api/search.js
const { query } = require('@/db'); // Adjust the import path as necessary

export default async function handler(req, res) {
    const { cardName, page = '1', limit = '24' } = req.query;
    // Ensure page and limit are integers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    try {
        const sql = `
            SELECT * FROM Card
            WHERE CardName LIKE ?
            LIMIT ? OFFSET ?
        `;
        // Use the query function from your db module
        const values = [`%${cardName}%`, limitNum, offset];
        const rows = await query(sql, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Failed to fetch cards:", error);
        res.status(500).json({ message: "Failed to fetch cards" });
    }
}
