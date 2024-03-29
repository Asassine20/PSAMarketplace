const { query } = require('@/db');

export default async function handler(req, res) {
    const {
        fetchFilters,
        cardName = '',
        cardNumber,
        cardColor,
        cardVariant,
        sport,
        cardYear,
        cardSet,
        page = '1', // Provide a default value to ensure page is always defined
        limit = '24',
        showAll = 'false',
    } = req.query;

    // The rest of your code follows
    let baseSql = `FROM Card`;
    let whereConditions = [];
    let values = [];

    if (showAll !== 'true') {
        whereConditions.push(`inStock = 1`);
    }

    // Filter conditions
    if (cardName) {
        whereConditions.push(`CardName LIKE ?`);
        values.push(`%${cardName.trim()}%`);
    }
    if (cardNumber) {
        whereConditions.push(`CardNumber = ?`);
        values.push(cardNumber);
    }
    if (cardColor) {
        whereConditions.push(`CardColor = ?`);
        values.push(cardColor);
    }
    if (cardVariant) {
        whereConditions.push(`CardVariant = ?`);
        values.push(cardVariant);
    }
    if (sport) {
        whereConditions.push(`Sport = ?`);
        values.push(sport);
    }
    if (cardYear) {
        whereConditions.push(`CardYear = ?`);
        values.push(cardYear);
    }
    if (cardSet) {
        whereConditions.push(`CardSet = ?`);
        values.push(cardSet);
    }

    let whereSql = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    if (fetchFilters === 'true') {
        try {
            const promises = [
                query(`SELECT DISTINCT Sport ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardSet ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardYear ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardColor ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardVariant ${baseSql} ${whereSql}`, values),
            ];

            const [sports, cardSets, cardYears, cardColors, cardVariants] = await Promise.all(promises);

            const transformResults = results => results.map(result => Object.values(result)[0]);

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
        const pageNum = parseInt(page, 10); // page is now defined via destructuring from req.query
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let sql = `SELECT * FROM Card WHERE inStock = 1`;
        let whereConditions = [];
        let values = [];

        if (showAll === 'true') {
            sql = `SELECT * FROM Card`; // If showing all, remove inStock condition
        }

        // The following conditions add to the WHERE clause based on user input
        if (cardName) {
            whereConditions.push("CardName LIKE ?");
            values.push(`%${cardName.trim()}%`);
        }
        if (cardNumber) {
            whereConditions.push("CardNumber = ?");
            values.push(cardNumber);
        }
        if (cardColor) {
            whereConditions.push("CardColor = ?");
            values.push(cardColor);
        }
        if (cardVariant) {
            whereConditions.push("CardVariant = ?");
            values.push(cardVariant);
        }
        if (sport) {
            whereConditions.push("Sport = ?");
            values.push(sport);
        }
        if (cardYear) {
            whereConditions.push("CardYear = ?");
            values.push(cardYear);
        }
        if (cardSet) {
            whereConditions.push("CardSet = ?");
            values.push(cardSet);
        }

        // Add any additional WHERE conditions
        if (whereConditions.length > 0) {
            sql += (showAll === 'true' ? ' WHERE ' : ' AND ') + whereConditions.join(' AND ');
        }

        // Omitted the ORDER BY clause
        values.push(limitNum, offset); // This line can also be removed if LIMIT and OFFSET are not used without ORDER BY

        try {
            const rows = await query(sql, values);
            res.status(200).json(rows);
        } catch (error) {
            console.error("Failed to fetch cards:", error);
            res.status(500).json({ message: "Failed to fetch cards" });
        }
    }
}
