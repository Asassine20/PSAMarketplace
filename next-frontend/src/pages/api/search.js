import db from '@/db';

router.get('/search', async (req, res) => {
    const { cardName, sport, cardSet, cardColor, cardVariant, cardYear } = req.query;
    let query = "SELECT * FROM Card WHERE 1 = 1";
    let values = [];

    if (cardName) {
        query += " AND CardName LIKE ?";
        values.push(`%${cardName}%`);
    }

    if (sport) {
        query += " AND Sport = ?";
        values.push(sport);
    }

    if (cardSet) {
        query += " AND CardSet = ?";
        values.push(cardSet);
    }

    if (cardColor) {
        query += " AND CardColor = ?";
        values.push(cardColor);
    }

    if (cardVariant) {
        query += " AND CardVariant = ?";
        values.push(cardVariant);
    }

    if (cardYear) {
        query += " AND CardYear = ?";
        values.push(cardYear);
    }

    try {
        const result = await db.query(query, values);
        res.json(result);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send('Error fetching cards');
    }
});
