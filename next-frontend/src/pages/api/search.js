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

    // Apply 'inStock = 1' condition only if showAll is not 'true'.
    if (showAll !== 'true') {
        whereConditions.push(`inStock = 1`);
    }

    if (cardName) {
        whereConditions.push(`CardName LIKE ?`);
        values.push(`%${cardName.trim()}%`);
    }

    // Example adjustment for handling 'cardSets[]'
    if (req.query['cardSets[]']) {
        const cardSets = Array.isArray(req.query['cardSets[]']) ? req.query['cardSets[]'] : [req.query['cardSets[]']];
        whereConditions.push(`CardSet IN (${cardSets.map(() => '?').join(', ')})`);
        values.push(...cardSets);
    }


    // Handling multiple cardColors
    if (req.query['cardColors[]']) {
        const cardColors = Array.isArray(req.query['cardColors[]']) ? req.query['cardColors[]'] : [req.query['cardColors[]']];
        whereConditions.push(`CardColor IN (${cardColors.map(() => '?').join(',')})`);
        values.push(...cardColors);
    }

    // Handling multiple cardVariants
    if (req.query['cardVariants[]']) {
        const cardVariants = Array.isArray(req.query['cardVariants[]']) ? req.query['cardVariants[]'] : [req.query['cardVariants[]']];
        whereConditions.push(`CardVariant IN (${cardVariants.map(() => '?').join(',')})`);
        values.push(...cardVariants);
    }

    // Handling multiple sports
    if (req.query['sports[]']) {
        const sports = Array.isArray(req.query['sports[]']) ? req.query['sports[]'] : [req.query['sports[]']];
        whereConditions.push(`Sport IN (${sports.map(() => '?').join(',')})`);
        values.push(...sports);
    }

    // Handling multiple cardYears
    if (req.query['cardYears[]']) {
        const cardYears = Array.isArray(req.query['cardYears[]']) ? req.query['cardYears[]'] : [req.query['cardYears[]']];
        whereConditions.push(`CardYear IN (${cardYears.map(() => '?').join(',')})`);
        values.push(...cardYears);
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

            const results = await Promise.all(promises);
            const [sports, cardSets, cardYears, cardColors, cardVariants] = results;


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

        let sql = `SELECT * ${baseSql} ${whereSql} LIMIT ? OFFSET ?`;
        values.push(limitNum, offset);
        console.log("Constructed SQL query:", sql, values);

        let countSql = `SELECT COUNT(*) as totalCount ${baseSql} ${whereSql}`;
        try {
            const totalCountResults = await query(countSql, values);
            const totalCount = totalCountResults[0].totalCount;
        
            // Now fetch paginated results as before
            let sql = `SELECT * ${baseSql} ${whereSql} LIMIT ? OFFSET ?`;
            values.push(limitNum, offset);
        
            const rows = await query(sql, values);
            res.status(200).json({
                cards: rows,
                totalCount // Include the totalCount in the response
            });
        } catch (error) {
            console.error("Failed to execute query:", error);
            res.status(500).json({ message: "Failed to execute query" });
        }
    }
}