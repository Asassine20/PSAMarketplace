const { query } = require('@/db');

export default async function handler(req, res) {
    const {
        fetchFilters,
        searchMode = 'inventory',
        cardName,
        cardNumber,
        cardColor,
        cardVariant,
        sport,
        cardYear,
        cardSet,
        page = '1',
        limit = '24',
    } = req.query;

    if (fetchFilters === 'true') {
        try {
            const sportsPromise = query(`SELECT DISTINCT Sport FROM Card`);
            const cardSetsPromise = query(`SELECT DISTINCT CardSet FROM Card`);
            const cardYearsPromise = query(`SELECT DISTINCT CardYear FROM Card`);
            const cardColorsPromise = query(`SELECT DISTINCT CardColor FROM Card`);
            const cardVariantsPromise = query(`SELECT DISTINCT CardVariant FROM Card`);
            
            const [sports, cardSets, cardYears, cardColors, cardVariants] = await Promise.all([
                sportsPromise, cardSetsPromise, cardYearsPromise, cardColorsPromise, cardVariantsPromise
            ]);

            const transformResults = (results) => results.map(result => Object.values(result)[0]);

            res.status(200).json({
                sports: transformResults(sports),
                cardSets: transformResults(cardSets),
                cardYears: transformResults(cardYears),
                cardColors: transformResults(cardColors),
                cardVariants: transformResults(cardVariants),
            });
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
            res.status(500).json({ message: "Failed to fetch filter options" });
        }
    } else {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let sql, whereConditions = [], values = [];

        if (searchMode === 'inventory') {
            sql = `SELECT Card.*, MIN(Inventory.SalePrice) AS MinSalePrice 
                   FROM Inventory 
                   JOIN Card ON Inventory.CardID = Card.CardID`;
        } else {
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

        if (searchMode === 'inventory') {
            sql += ` GROUP BY Card.CardID`;
        }

        sql += ` ORDER BY Card.CardName LIMIT ? OFFSET ?`;
        values.push(limitNum, offset);

        try {
            const rows = await query(sql, values);
            res.status(200).json(rows);
        } catch (error) {
            console.error("Failed to fetch cards:", error);
            res.status(500).json({ message: "Failed to fetch cards" });
        }
    }
}
