const { query } = require('@/db');

export default async function handler(req, res) {
    const {
        fetchFilters,
        cardName = '',
        cardColor,
        cardVariant,
        sport,
        cardYear,
        cardSet,
        page = '1',
        limit = '24',
        showAll = 'false',
    } = req.query;

    let baseSql = `FROM Card`;
    let whereConditions = [];
    let values = [];

    if (showAll !== 'true') {
        whereConditions.push(`inStock = 1`);
    }

    if (cardName) {
        whereConditions.push(`CardName LIKE ?`);
        values.push(`%${cardName.trim()}%`);
    }

    // Dynamic handling for array filters (e.g., cardSets, cardColors)
    ['cardSets', 'cardColors', 'cardVariants', 'sports', 'cardYears'].forEach(filter => {
        if (req.query[`${filter}[]`]) {
            const items = Array.isArray(req.query[`${filter}[]`]) ? req.query[`${filter}[]`] : [req.query[`${filter}[]`]];
            whereConditions.push(`${filter.slice(0, -1)} IN (${items.map(() => '?').join(',')})`);
            values.push(...items);
        }
    });

    let whereSql = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    if (fetchFilters === 'true') {
        try {
            const filtersPromises = [
                query(`SELECT DISTINCT Sport ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardSet ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardYear ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardColor ${baseSql} ${whereSql}`, values),
                query(`SELECT DISTINCT CardVariant ${baseSql} ${whereSql}`, values),
            ];

            const [sports, cardSets, cardYears, cardColors, cardVariants] = await Promise.all(filtersPromises);

            res.status(200).json({
                sports: sports.map(r => r.Sport),
                cardSets: cardSets.map(r => r.CardSet),
                cardYears: cardYears.map(r => r.CardYear),
                cardColors: cardColors.map(r => r.CardColor),
                cardVariants: cardVariants.map(r => r.CardVariant),
            });
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
            res.status(500).json({ message: "Failed to fetch filter options" });
        }
    } else {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        try {
            const totalCountResults = await query(`SELECT COUNT(*) as totalCount ${baseSql} ${whereSql}`, values);
            const totalCount = totalCountResults[0].totalCount;

            let sql = `SELECT * ${baseSql} ${whereSql} LIMIT ? OFFSET ?`;
            values.push(limitNum, offset);

            const rows = await query(sql, values);
            res.status(200).json({
                cards: rows,
                totalCount
            });
        } catch (error) {
            console.error("Failed to execute query:", error);
            res.status(500).json({ message: "Failed to execute query" });
        }
    }
}
