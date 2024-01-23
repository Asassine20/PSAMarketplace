const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/middleware.js');
const db = require('../db');

router.use(express.urlencoded({ extended: true }));

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
    const sellerId = req.user.id; // Assuming the user's ID is stored in req.user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.pageSize) || 25;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.searchTerm || '';
    const cardSet = req.query.cardSet || '';
    const cardYear = req.query.cardYear || '';
    const sport = req.query.sport || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';

    try {
        // Query for search and pagination
        const query = `
            SELECT * FROM Card 
            WHERE CardName LIKE ? 
            AND CardSet LIKE ? 
            AND CardYear LIKE ? 
            AND Sport LIKE ? 
            AND CardColor LIKE ? 
            AND CardVariant LIKE ? 
            LIMIT ? OFFSET ?`;
        const values = [
            `%${searchTerm}%`, 
            `%${cardSet}%`, 
            `%${cardYear}%`, 
            `%${sport}%`, 
            `%${cardColor}%`, 
            `%${cardVariant}%`, 
            limit, offset
        ];

        // Query for total count with filters
        const countQuery = "SELECT COUNT(*) AS count FROM Card WHERE CardName LIKE ? AND CardSet LIKE ? AND CardYear LIKE ? AND Sport LIKE ?";
        const countValues = [`%${searchTerm}%`, `%${cardSet}%`, `%${cardYear}%`, `%${sport}%`];

        const cards = await db.query(query, values);

        const totalResult = await db.query(countQuery, countValues);
        const totalItems = totalResult[0].count; 
        const totalPages = Math.ceil(totalItems / limit);

        const showPrevious = page > 1;
        const showNext = page < totalPages;

        const cardSetsData = await db.query('SELECT DISTINCT CardSet FROM Card');
        const cardYearsData = await db.query('SELECT DISTINCT CardYear FROM Card');
        const sportsData = await db.query('SELECT DISTINCT Sport FROM Card');    
        const cardColorsData = await db.query('SELECT DISTINCT CardColor FROM Card WHERE CardColor IS NOT NULL AND CardColor != \'\'');
        const cardVariantsData = await db.query('SELECT DISTINCT CardVariant FROM Card WHERE CardVariant IS NOT NULL');
        // Fetch inventory with a flag for in-stock items
        const inventoryQuery = 'SELECT *, (ListingID IS NOT NULL) AS isInStock FROM Inventory WHERE SellerID = ?';
        const inventoryItems = await db.query(inventoryQuery, [sellerId]);

        // Create a Set of CardIDs that are in stock
        const inStockCardIds = new Set(inventoryItems.filter(item => item.isInStock).map(item => item.CardID));

        // Map over the cards to include isInStock property
        const updatedCards = cards.map(card => ({
        ...card,
        isInStock: inStockCardIds.has(card.CardID) // Set isInStock to true if CardID is in the inStockCardIds set
        }));



        res.render('inventory', { 
            username: req.user.username, 
            cards: updatedCards,
            searchTerm,
            cardSet, // Use the same name as the query parameter
            cardYear, // Use the same name as the query parameter
            sport, // Use the same name as the query parameter
            cardSets: cardSetsData.map(row => row.CardSet),
            cardYears: cardYearsData.map(row => row.CardYear),
            sports: sportsData.map(row => row.Sport),
            cardColors: cardColorsData.map(row => row.CardColor).filter(color => color.trim() !== ''),
            cardVariants: cardVariantsData.map(row => row.CardVariant),
            currentPage: page,
            totalPages,
            showPrevious,
            showNext,
            totalItems,
            inventoryItems
    
        });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send('Server error');
    }
});

router.get('/cardsets', authenticateToken, async (req, res) => {
    const sport = req.query.sport || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';

    let query = "SELECT DISTINCT CardSet FROM Card";
    let conditions = [];
    let values = [];

    if (sport) {
        conditions.push("Sport = ?");
        values.push(sport);
    }
    if (year) {
        conditions.push("CardYear = ?");
        values.push(year);
    }
    if (cardColor) {
        conditions.push("CardColor = ?");
        values.push(cardColor);
    }
    if (cardVariant) {
        conditions.push("CardVariant = ?");
        values.push(cardVariant);
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
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    
    let query = "SELECT DISTINCT CardYear FROM Card";
    let conditions = [];
    let values = [];

    if (sport) {
        conditions.push("Sport = ?");
        values.push(sport); // Use exact match for sport
    }
    if (cardSet) {
        conditions.push("CardSet = ?");
        values.push(cardSet); // Use exact match for cardSet
    }
    if (cardColor) {
        conditions.push("CardColor = ?");
        values.push(cardColor);
    }
    if (cardVariant) {
        conditions.push("CardVariant = ?");
        values.push(cardVariant);
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
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';

    let query = "SELECT DISTINCT Sport FROM Card";
    let conditions = [];
    let values = [];

    if (cardSet) {
        conditions.push("CardSet = ?");
        values.push(cardSet);
    }
    if (year) {
        conditions.push("CardYear = ?");
        values.push(year);
    }
    if (cardColor) {
        conditions.push("CardColor = ?");
        values.push(cardColor);
    }
    if (cardVariant) {
        conditions.push("CardVariant = ?");
        values.push(cardVariant);
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

// Endpoint for full search
router.get('/search-card-sets', authenticateToken, async (req, res) => {
    const { term, sport, year } = req.query;
    let query = "SELECT DISTINCT CardSet FROM Card WHERE CardSet LIKE ?";
    let values = [`%${term}%`];

    // Use exact matches for sport and year
    if (sport) {
        query += " AND Sport = ?";
        values.push(sport); 
    }
    if (year) {
        query += " AND CardYear = ?";
        values.push(year); 
    }

    try {
        const result = await db.query(query, values);
        const cardSets = result.map(row => row.CardSet);
        res.json(cardSets);
    } catch (error) {
        console.error('Error searching card sets:', error);
        res.status(500).send('Server error');
    }
});

router.get('/update-inventory-pricing', authenticateToken, async (req, res) => {
    const cardId = req.query.cardId;
    const sellerId = req.user.id;

    try {
        // Fetch inventory item
        const inventoryQuery = 'SELECT * FROM Inventory WHERE CardID = ? AND SellerID = ?';
        const inventoryItem = await db.query(inventoryQuery, [cardId, sellerId]);
        let inventoryData = inventoryItem.length > 0 ? inventoryItem[0] : {};


        // Fetch card details
        const cardDetailsQuery = 'SELECT CardID, CardName, CardSet, CardYear, CardNumber, CardImage FROM Card WHERE CardID = ?';
        const cardDetails = await db.query(cardDetailsQuery, [cardId]);

        // Fetch grade IDs for the card
        const gradeQuery = 'SELECT GradeID, GradeValue FROM Grade WHERE CardID = ? ORDER BY GradeValue DESC';
        const gradeData = await db.query(gradeQuery, [cardId]);
        const gradesWithIds = gradeData.map(gradeRow => ({
            gradeValue: gradeRow.GradeValue,
            gradeId: gradeRow.GradeID
        }));

        // Render the page with fetched data
        res.render('update_inventory', {
            inventory: inventoryData, // existing inventory data
            existingInventory: inventoryData, // additional key for pre-populating form
            cardDetails: cardDetails.length > 0 ? cardDetails[0] : {},
            grades: gradesWithIds
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});

router.post('/submit-inventory', authenticateToken, async (req, res) => {
    const { cardId, listingId, gradeIds = [], salePrices = [], quantities = [], clearInventory } = req.body;
    const sellerId = req.user.id;

    try {
        // Check if the "Clear Inventory" button was pressed
        if (clearInventory && listingId) {
            await db.query('DELETE FROM Inventory WHERE ListingID = ? AND SellerID = ?', [listingId, sellerId]);
            return res.redirect('/inventory');
        }

        for (let index = 0; index < gradeIds.length; index++) {
            const gradeId = gradeIds[index];
            const salePrice = salePrices[index];
            const quantity = quantities[index];
            
            // If the quantity is 0, remove the item from inventory if it exists
            if (quantity === '0') {
                if (listingId) {
                    await db.query('DELETE FROM Inventory WHERE ListingID = ? AND SellerID = ?', [listingId, sellerId]);
                }
                continue; // Skip to the next item
            }

            // Continue with update or insert as before
            if (salePrice && quantity) {
                let query, queryParams;
                if (listingId) {
                    query = 'UPDATE Inventory SET GradeID = ?, SalePrice = ?, Quantity = ? WHERE ListingID = ? AND SellerID = ?';
                    queryParams = [gradeId, salePrice, quantity, listingId, sellerId];
                } else {
                    query = 'INSERT INTO Inventory (CardID, GradeID, SalePrice, SellerID, Quantity) VALUES (?, ?, ?, ?, ?)';
                    queryParams = [cardId, gradeId, salePrice, sellerId, quantity];
                }
                await db.query(query, queryParams);
            }
        }

        res.redirect('/inventory');
    } catch (err) {
        console.error('Error processing inventory:', err);
        res.status(500).send('Error processing inventory');
    }
});



module.exports = router;