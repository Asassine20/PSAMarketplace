const { query } = require('@/db'); // Adjust the import path as necessary

export default async function handler(req, res) {
    const { cardName, page = '1', limit = '24' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Base SQL and values array
    let sql = `SELECT * FROM Card`;
    let whereConditions = [];
    let values = [];

    // Check if there's a cardName search term
    if (cardName) {
        whereConditions.push("CardName LIKE ?");
        values.push(`${cardName.trim()}%`); // Using '%' at the end for prefix matching
    }

    // If there are any conditions, append them to the query
    if (whereConditions.length > 0) {
        sql += ` WHERE ` + whereConditions.join(' AND ');
    }

    // Append LIMIT and OFFSET for pagination
    sql += ` LIMIT ? OFFSET ?`;
    values.push(limitNum, offset);

    try {
        const rows = await query(sql, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Failed to fetch cards:", error);
        res.status(500).json({ message: "Failed to fetch cards" });
    }
}
