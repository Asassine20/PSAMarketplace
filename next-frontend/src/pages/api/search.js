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
        let baseSql = `FROM Card`;
        let whereConditions = [];
        let values = [];

        if (cardName) {
            whereConditions.push("CardName LIKE ?");
            values.push(`%${cardName.trim()}%`);
        }
        // Add more conditions based on other search parameters if needed

        let whereSql = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

        try {
            const sportsPromise = query(`SELECT DISTINCT Sport ${baseSql} ${whereSql}`, values);
            const cardSetsPromise = query(`SELECT DISTINCT CardSet ${baseSql} ${whereSql}`, values);
            const cardYearsPromise = query(`SELECT DISTINCT CardYear ${baseSql} ${whereSql}`, values);
            const cardColorsPromise = query(`SELECT DISTINCT CardColor ${baseSql} ${whereSql}`, values);
            const cardVariantsPromise = query(`SELECT DISTINCT CardVariant ${baseSql} ${whereSql}`, values);
            
            const [sports, cardSets, cardYears, cardColors, cardVariants] = await Promise.all([
                sportsPromise, cardSetsPromise, cardYearsPromise, cardColorsPromise, cardVariantsPromise
            ]);

            res.status(200).json({
                sports: sports.map(s => s.Sport),
                cardSets: cardSets.map(cs => cs.CardSet),
                cardYears: cardYears.map(cy => cy.CardYear),
                cardColors: cardColors.map(cc => cc.CardColor),
                cardVariants: cardVariants.map(cv => cv.CardVariant),
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
