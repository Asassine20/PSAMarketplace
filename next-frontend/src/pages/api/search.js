const { query } = require('@/db');

export default async function handler(req, res) {
    const {
        fetchFilters,
        cardName = '',
        cardColor,
        cardVariant,
        sports,
        cardYears,
        cardSets,
        page = '1',
        limit = '24',
        inStock = 'false',
        sortBy = '', // Changed to sortBy
        filterPage = '1',
        filterLimit = '50',
        filterType
    } = req.query;

    let baseSql = `FROM Card`;
    let whereConditions = [];
    let values = [];

    if (inStock === 'true') {
        whereConditions.push(`inStock = 1`);
    }

    if (cardName) {
        whereConditions.push(`CardName LIKE ?`);
        values.push(`%${cardName.trim()}%`);
    }

    ['cardSets', 'cardColors', 'cardVariants', 'sports', 'cardYears'].forEach(filter => {
        if (req.query[`${filter}[]`]) {
            const items = Array.isArray(req.query[`${filter}[]`]) ? req.query[`${filter}[]`] : [req.query[`${filter}[]`]];
            whereConditions.push(`${filter.slice(0, -1)} IN (${items.map(() => '?').join(',')})`);
            values.push(...items);
        }
    });

    let whereSql = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    let orderBySql = '';
    if (sortBy === 'nameAsc') {
        orderBySql = 'ORDER BY CardName ASC';
    } else if (sortBy === 'priceHighToLow') {
        orderBySql = 'ORDER BY MarketPrice DESC';
    } else if (sortBy === 'priceLowToHigh') {
        orderBySql = 'ORDER BY MarketPrice ASC';
    }

    if (fetchFilters === 'true') {
        const filterPageNum = parseInt(filterPage, 10);
        const filterLimitNum = parseInt(filterLimit, 10);
        const filterOffset = (filterPageNum - 1) * filterLimitNum;

        try {
            const filtersPromises = [
                query(`SELECT Sport, COUNT(*) as count ${baseSql} ${whereSql} ${whereSql ? 'AND' : 'WHERE'} Sport IS NOT NULL GROUP BY Sport ORDER BY count DESC`, values),
                query(`SELECT CardYear, COUNT(*) as count ${baseSql} ${whereSql} ${whereSql ? 'AND' : 'WHERE'} CardYear IS NOT NULL GROUP BY CardYear ORDER BY CardYear DESC`, values),
                query(`SELECT CardColor, COUNT(*) as count ${baseSql} ${whereSql} ${whereSql ? 'AND' : 'WHERE'} CardColor IS NOT NULL GROUP BY CardColor ORDER BY count DESC`, values),
                query(`SELECT CardVariant, COUNT(*) as count ${baseSql} ${whereSql} ${whereSql ? 'AND' : 'WHERE'} CardVariant IS NOT NULL GROUP BY CardVariant ORDER BY count DESC`, values),
            ];

            if (filterType === 'cardSets' || !filterType) {
                filtersPromises.push(
                    query(`SELECT CardSet, COUNT(*) as count ${baseSql} ${whereSql} ${whereSql ? 'AND' : 'WHERE'} CardSet IS NOT NULL GROUP BY CardSet ORDER BY count DESC LIMIT ? OFFSET ?`, [...values, filterLimitNum, filterOffset])
                );
            }

            const [sports, cardYears, cardColors, cardVariants, cardSets] = await Promise.all(filtersPromises);

            res.status(200).json({
                sports: sports.map(r => ({ name: r.Sport, count: r.count })),
                cardSets: cardSets ? cardSets.map(r => ({ name: r.CardSet, count: r.count })) : [],
                cardYears: cardYears.map(r => ({ name: r.CardYear, count: r.count })),
                cardColors: cardColors.map(r => ({ name: r.CardColor, count: r.count })),
                cardVariants: cardVariants.map(r => ({ name: r.CardVariant, count: r.count })),
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
            let sql = `
            SELECT Card.*, 
                   Card.MarketPrice, 
                   COUNT(Inventory.CardID) as ListingsCount
            ${baseSql}
            LEFT JOIN Inventory ON Card.CardID = Inventory.CardID
            ${whereSql}
            GROUP BY Card.CardID
            ${orderBySql}
            LIMIT ? OFFSET ?`;

            values.push(limitNum, offset);

            const cardsData = await query(sql, values);

            const totalCountResult = await query(`SELECT COUNT(DISTINCT Card.CardID) as totalCount ${baseSql} ${whereSql}`, values.slice(0, -2));
            const totalCount = totalCountResult[0]?.totalCount || 0;

            res.status(200).json({
                cards: cardsData,
                totalCount
            });
        } catch (error) {
            console.error("Failed to execute query:", error);
            res.status(500).json({ message: "Failed to execute query" });
        }
    }
}
