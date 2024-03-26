const { query } = require('@/db');

export default async function handler(req, res) {
    const { searchMode = 'inventory', cardName, cardNumber, cardColor, cardVariant, sport, cardYear, cardSet, page = '1', limit = '24' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let sql, whereConditions = [], values = [];

    if (searchMode === 'inventory') {
        // Adjusting the query to group results by CardID for distinct card entries
        sql = `SELECT Card.*, MIN(Inventory.SalePrice) AS MinSalePrice 
               FROM Inventory 
               JOIN Card ON Inventory.CardID = Card.CardID`;
    } else {
        // Optional search through the Card catalog
        sql = `SELECT * FROM Card`;
    }

    if (cardName) {
        whereConditions.push("Card.CardName LIKE ?");
        values.push(`%${cardName.trim()}%`);
    }
    if (cardNumber) {
        whereConditions.push("Card.CardNumber = ?");
        values.push(cardNumber);
    }
    if (cardColor) {
        whereConditions.push("Card.CardColor = ?");
        values.push(cardColor);
    }
    if (cardVariant) {
        whereConditions.push("Card.CardVariant = ?");
        values.push(cardVariant);
    }
    if (sport) {
        whereConditions.push("Card.Sport = ?");
        values.push(sport);
    }
    if (cardYear) {
        whereConditions.push("Card.CardYear = ?");
        values.push(cardYear);
    }
    if (cardSet) {
        whereConditions.push("Card.CardSet = ?");
        values.push(cardSet);
    }

    if (whereConditions.length > 0) {
        sql += ` WHERE ` + whereConditions.join(' AND ');
    }

    // Group by CardID for distinct card entries; applicable for inventory mode
    if (searchMode === 'inventory') {
        sql += ` GROUP BY Card.CardID`;
    }

    sql += ` ORDER BY Card.CardName LIMIT ? OFFSET ?`; // Adding ORDER BY for consistent ordering
    values.push(limitNum, offset);

    try {
        const rows = await query(sql, values);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Failed to fetch cards:", error);
        res.status(500).json({ message: "Failed to fetch cards" });
    }
}
