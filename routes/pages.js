const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/middleware.js');
const db = require('../db');

router.get('/', (req, res) => {
    res.render('index')
});

router.get('/register', (req, res) => {
    res.render('register')
});

router.get('/login', (req, res) => {
    res.render('login')
});

router.get('/dashboard', authenticateToken, (req, res) => {
    res.render('dashboard', { username: req.user.username });
});

router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('login');
});

router.get('/inventory', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.searchTerm || '';
    const cardSet = req.query.cardSet || '';
    const cardYear = req.query.cardYear || '';
    const sport = req.query.sport || '';

    try {
        // Query for search and pagination
        const query = "SELECT * FROM Card WHERE CardName LIKE ? AND CardSet LIKE ? AND CardYear LIKE ? AND Sport LIKE ? LIMIT ? OFFSET ?";
        const values = [`%${searchTerm}%`, `%${cardSet}%`, `%${cardYear}%`, `%${sport}%`, limit, offset];

        // Query for total count with filters
        const countQuery = "SELECT COUNT(*) AS count FROM Card WHERE CardName LIKE ? AND CardSet LIKE ? AND CardYear LIKE ? AND Sport LIKE ?";
        const countValues = [`%${searchTerm}%`, `%${cardSet}%`, `%${cardYear}%`, `%${sport}%`];

        const cards = await db.query(query, values);
        const totalResult = await db.query(countQuery, countValues);
        const totalItems = totalResult[0].count; 
        const totalPages = Math.ceil(totalItems / limit);

        const showPrevious = page > 1;
        const showNext = page < totalPages;

        const cardSets = await db.query('SELECT DISTINCT CardSet FROM Card');
        const cardYears = await db.query('SELECT DISTINCT CardYear FROM Card');
        const sports = await db.query('SELECT DISTINCT Sport FROM Card');

        res.render('inventory', { 
            username: req.user.username, 
            cards,
            searchTerm,
            cardSets: [], //cardSets'''.map(row => row.CardSet),
            cardYears: cardYears.map(row => row.CardYear),
            sports: sports.map(row => row.Sport),
            currentPage: page,
            totalPages,
            showPrevious,
            showNext,
            totalItems
        });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send('Server error');
    }
});

router.get('/cardsets', authenticateToken, async (req, res) => {
    const sport = req.query.sport || '';
    const year = req.query.year || '';
    
    let query = "SELECT DISTINCT CardSet FROM Card";
    let conditions = [];
    let values = [];

    if (sport) {
        conditions.push("Sport LIKE ?");
        values.push(`%${sport}%`);
    }
    if (year) {
        conditions.push("CardYear LIKE ?");
        values.push(`%${year}%`);
    }
    
    if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY CardSet";

    try {
        const cardSets = await db.query(query, values);
        res.json(cardSets.map(row => row.CardSet));
    } catch (error) {
        console.error('Error fetching card sets:', error);
        res.status(500).send('Server error');
    }
});


router.get('/years', authenticateToken, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    
    let query = "SELECT DISTINCT CardYear FROM Card";
    let conditions = [];
    let values = [];

    if (sport) {
        conditions.push("Sport LIKE ?");
        values.push(`%${sport}%`);
    }
    if (cardSet) {
        conditions.push("CardSet LIKE ?");
        values.push(`%${cardSet}%`);
    }
    
    if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY CardYear DESC";

    try {
        const years = await db.query(query, values);
        res.json(years.map(row => row.CardYear));
    } catch (error) {
        console.error('Error fetching years:', error);
        res.status(500).send('Server error');
    }
});

router.get('/sports', authenticateToken, async (req, res) => {
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';

    let query = "SELECT DISTINCT Sport FROM Card";
    let conditions = [];
    let values = [];

    if (cardSet) {
        conditions.push("CardSet LIKE ?");
        values.push(`%${cardSet}%`);
    }
    if (year) {
        conditions.push("CardYear LIKE ?");
        values.push(`%${year}%`);
    }

    if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY Sport";

    try {
        const sports = await db.query(query, values);
        res.json(sports.map(row => row.Sport));
    } catch (error) {
        console.error('Error fetching sports:', error);
        res.status(500).send('Server error');
    }
});

// Endpoint for initial limited card sets
router.get('/get-limited-card-sets', authenticateToken, async (req, res) => {
    try {
        const query = "SELECT DISTINCT CardSet FROM Card LIMIT 10"; // Adjust the limit as needed
        const result = await db.query(query);
        res.json(result.map(row => row.CardSet));
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Endpoint for full search
router.get('/search-card-sets', authenticateToken, async (req, res) => {
    const searchTerm = req.query.term || '';
    try {
        const query = "SELECT DISTINCT CardSet FROM Card WHERE CardSet LIKE ?";
        const values = [`%${searchTerm}%`];
        const result = await db.query(query, values);
        res.json(result.map(row => row.CardSet));
    } catch (error) {
        res.status(500).send('Server error');
    }
});


router.get('/get-all-card-sets', authenticateToken, async (req, res) => {
    try {
        const query = "SELECT DISTINCT CardSet FROM Card";
        const result = await db.query(query);
        const cardSets = result.map(row => row.CardSet);
        res.json(cardSets);
    } catch (error) {
        console.error('Error fetching all card sets:', error);
        res.status(500).send('Server error');
    }
});



module.exports = router;