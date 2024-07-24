const express = require('express');
const router = express.Router();
const { authenticateToken, notificationCounts } = require('../middleware/middleware.js');
const db = require('../db');
const redis = require('redis');
const redisClient = redis.createClient();
const axios = require('axios');
const PDFDocument = require('pdfkit');
redisClient.connect();
router.use(express.json()); // This line is crucial

router.use(express.urlencoded({ extended: true }));

router.get('/', (req, res) => {
    res.render('index')
});

router.get('/register', (req, res) => {
    res.render('register')
});

router.get('seller-info', (req, res) => {
    res.render('seller-info')
})

router.get('/register/seller-info', (req, res) => {
    const encodedEmail = req.query.email; // This is the encoded email from the URL
    const email = decodeURIComponent(encodedEmail || ''); // Decode it to get the original email

    res.render('seller-info', {
        formData: { email: email } // Ensure the email is included in formData
    });
});

router.get('/final-verification', (req, res) => {
    res.render('final-verification');
});

router.post('/check-store-name', async (req, res) => {
    const { storeName } = req.body;

    if (!storeName) {
        // If storeName is not provided in the request body, respond accordingly
        return res.status(400).json({ error: true, message: 'Store name is required.' });
    }

    try {
        const query = 'SELECT * FROM Stores WHERE StoreName = ?';
        const [rows] = await db.query(query, [storeName]);

        if (rows && rows.length > 0) {
            // Store name exists
            res.json({ exists: true, message: 'Store name already exists' });
        } else {
            // Store name does not exist or no rows returned
            res.json({ exists: false });
        }
    } catch (error) {
        console.error("Check Store Name Error: ", error);
        res.status(500).json({ error: true, message: 'An error occurred' });
    }
});


router.get('/login', (req, res) => {
    res.render('login')
});
router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshJwt;
    if (!refreshToken) {
        return res.status(403).json({ message: "Access Denied" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = {
            id: decoded.id,
            storeName: decoded.storeName
        };

        const newAccessToken = jwt.sign(user, process.env.JWT_SECRET, {
            expiresIn: '15m'
        });

        res.cookie('jwt', newAccessToken, { httpOnly: true, maxAge: 900000 }); // 15 minutes
        res.status(200).json({ message: "Token refreshed" });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(403).json({ message: "Invalid Token" });
    }
});
router.get('/admin/dashboard', authenticateToken, notificationCounts, async (req, res) => {
    const userId = req.user.id; // Assuming authentication middleware sets req.user.id

    try {
        // Fetch feedback stats (reuse the getFeedbackStats function)
        const feedbackStats = await getFeedbackStats(userId);

        // Fetch inventory count
        const inventoryQuery = `SELECT COUNT(*) AS inventoryCount FROM Inventory WHERE SellerID = ?`;
        // Assuming db.query returns an array of RowDataPacket objects as is standard
        const [results] = await db.query(inventoryQuery, [userId]);
        const inventoryCount = Number(results.inventoryCount ?? 0);


        // Correctly calculate total sales - Ensure this references the correct table
        const salesSumQuery = `SELECT SUM(SalePrice) AS totalValue FROM Inventory WHERE SellerID = ?`; // Adjusted to 'Sales' table
        const [salesSumResults] = await db.query(salesSumQuery, [userId]);
        const totalValue = Number(salesSumResults.totalValue ?? 0);

        // New query to calculate total sales from Orders
        const totalSalesQuery = `SELECT SUM(SalePrice) AS totalSales FROM Orders WHERE SellerID = ?`;
        const [totalSalesResults] = await db.query(totalSalesQuery, [userId]);
        const totalSales = Number(totalSalesResults.totalSales ?? 0);

        // New query to fetch the user's DateCreated
        const userDateCreatedQuery = `SELECT DateCreated FROM Users WHERE UserID = ?`;
        const [userDateCreatedResults] = await db.query(userDateCreatedQuery, [userId]);
        const userDateCreated = userDateCreatedResults.DateCreated ?? 'Not available';

        // Render the dashboard page with feedback stats, inventory count, and total sales
        res.render('dashboard', {
            feedbackStats: feedbackStats,
            inventoryCount: inventoryCount,
            totalValue: totalValue,
            totalSales: totalSales,
            userDateCreated: userDateCreated
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Server error');
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('login');
});


function getSurroundingPages(currentPage, totalPages) {
    const range = 2; // Determines how many pages to show around the current page
    let startPage = Math.max(1, currentPage - range);
    let endPage = Math.min(totalPages, currentPage + range);

    let pages = [];
    for (let page = startPage; page <= endPage; page++) {
        pages.push(page);
    }
    return pages;
}

router.get('/admin/inventory', authenticateToken, notificationCounts, async (req, res) => {
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
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';
    const inStock = req.query.inStock === 'true';

    try {
        let whereConditions = [];
        let values = [];

        if (searchTerm) {
            whereConditions.push("CardName LIKE ?");
            values.push(`${searchTerm.trim()}%`);
        }

        if (cardSet) {
            whereConditions.push("CardSet = ?");
            values.push(cardSet);
        }
        if (cardYear) {
            whereConditions.push("CardYear = ?");
            values.push(cardYear);
        }
        if (sport) {
            whereConditions.push("Sport = ?");
            values.push(sport);
        }
        if (cardColor) {
            whereConditions.push("CardColor = ?");
            values.push(cardColor);
        }
        if (cardVariant) {
            whereConditions.push("CardVariant = ?");
            values.push(cardVariant);
        }
        if (team) {
            whereConditions.push("Team = ?");
            values.push(team);
        }
        if (numbered) {
            whereConditions.push("Numbered = ?");
            values.push(numbered);
        }
        if (colorPattern) {
            whereConditions.push("ColorPattern = ?");
            values.push(colorPattern);
        }
        if (auto) {
            whereConditions.push("Auto = ?");
            values.push(auto);
        }

        let query = `
            SELECT * FROM Card
            ${whereConditions.length ? 'WHERE ' + whereConditions.join(' AND ') : ''}
        `;
        
        if (inStock) {
            if (whereConditions.length) {
                query += ` AND CardID IN (SELECT CardID FROM Inventory WHERE SellerID = ? AND Sold != 1)`;
            } else {
                query += ` WHERE CardID IN (SELECT CardID FROM Inventory WHERE SellerID = ? AND Sold != 1)`;
            }
            values.push(sellerId);
        }
        
        query += " LIMIT ? OFFSET ?";
        values.push(limit, offset);

        let countQuery = `
            SELECT COUNT(*) AS count FROM Card
            ${whereConditions.length ? 'WHERE ' + whereConditions.join(' AND ') : ''}
        `;
        
        if (inStock) {
            if (whereConditions.length) {
                countQuery += ` AND CardID IN (SELECT CardID FROM Inventory WHERE SellerID = ? AND Sold != 1)`;
            } else {
                countQuery += ` WHERE CardID IN (SELECT CardID FROM Inventory WHERE SellerID = ? AND Sold != 1)`;
            }
        }
        
        const countValues = inStock ? [...values.slice(0, -2), sellerId] : values.slice(0, -2);

        const cards = await db.query(query, values);
        const totalResult = await db.query(countQuery, countValues);
        const totalItems = totalResult[0].count;
        const totalPages = Math.ceil(totalItems / limit);
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);
        let pages = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);
        const showPrevious = page > 1;
        const showNext = page < totalPages;

        const cardSetsData = await db.query('SELECT DISTINCT CardSet FROM Card WHERE CardSet IS NOT NULL AND CardSet != \'\' ORDER BY CardSet DESC');
        const cardYearsData = await db.query('SELECT DISTINCT CardYear FROM Card WHERE CardYear IS NOT NULL AND CardYear != \'\' ORDER BY CardYear DESC');
        const sportsData = await db.query('SELECT DISTINCT Sport FROM Card WHERE Sport IS NOT NULL AND Sport != \'\' ORDER BY Sport DESC');
        const cardColorsData = await db.query('SELECT DISTINCT CardColor FROM Card WHERE CardColor IS NOT NULL AND CardColor != \'\'');
        const cardVariantsData = await db.query('SELECT DISTINCT CardVariant FROM Card WHERE CardVariant IS NOT NULL AND CardVariant != \'\'');
        const teamsData = await db.query('SELECT DISTINCT Team FROM Card WHERE Team IS NOT NULL AND Team != \'\''); 
        const numberedData = await db.query('SELECT DISTINCT Numbered FROM Card WHERE Numbered IS NOT NULL AND Numbered != \'\'');
        const colorPatternsData = await db.query('SELECT DISTINCT ColorPattern FROM Card WHERE ColorPattern IS NOT NULL AND ColorPattern != \'\'');
        const autoData = await db.query('SELECT DISTINCT Auto FROM Card WHERE Auto IS NOT NULL AND Auto != \'\'');

        const inventoryQuery = 'SELECT *, (ListingID IS NOT NULL) AS isInStock FROM Inventory WHERE SellerID = ? AND Sold != 1';
        const inventoryItems = await db.query(inventoryQuery, [sellerId]);

        const inStockCardIds = new Set(inventoryItems.filter(item => item.isInStock).map(item => item.CardID));
        const updatedCards = cards.map(card => ({
            ...card,
            isInStock: inStockCardIds.has(card.CardID)
        }));

        const pageData = {
            username: req.user.username,
            cards: updatedCards,
            searchTerm,
            inStock: inStock,
            cardSets: cardSetsData.map(row => row.CardSet).filter(cardSet => cardSet.trim() !==''),
            cardYears: cardYearsData.map(row => row.CardYear).filter(cardYear => cardYear.trim() !==''),
            sports: sportsData.map(row => row.Sport).filter(sport => sport.trim() !==''),
            cardColors: cardColorsData.map(row => row.CardColor).filter(color => color.trim() !== ''),
            cardVariants: cardVariantsData.map(row => row.CardVariant).filter(cardVariant => cardVariant.trim() !== ''),
            teams: teamsData.map(row => row.Team).filter(team => team.trim() !== ''),
            numberedOptions: numberedData.map(row => row.Numbered).filter(numbered => numbered.trim() !== ''),
            colorPatterns: colorPatternsData.map(row => row.ColorPattern).filter(colorPattern => colorPattern.trim() !==''),
            autoOptions: autoData.map(row => row.Auto).filter(auto => auto.trim() !== ''),
            pages: pages,
            currentPage: page,
            totalPages,
            showPrevious: page > 1,
            showNext: page < totalPages,
            showFirst: page > 1,
            showLast: page < totalPages,
            totalItems,
            inventoryItems
        };

        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json({
                cards: updatedCards,
                currentPage: page,
                totalPages: totalPages,
                pages: pages,
                showPrevious: page > 1,
                showNext: page < totalPages,
                showFirst: page > 1,
                showLast: page < totalPages,
                totalItems: totalItems
            });
        } else {
            res.render('inventory', pageData);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/cardsets', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';

    try {
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
        if (team) {
            conditions.push("Team = ?");
            values.push(team);
        }
        if (numbered) {
            conditions.push("Numbered = ?");
            values.push(numbered);
        }
        if (colorPattern) {
            conditions.push("ColorPattern = ?");
            values.push(colorPattern);
        }
        if (auto) {
            conditions.push("Auto = ?");
            values.push(auto);
        }

        if (conditions.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY CardSet";
        const cardSets = await db.query(query, values);
        res.json(cardSets.map(row => row.CardSet));
    } catch (error) {
        console.error('Error fetching card sets:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/years', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';

    try {
        let query = "SELECT DISTINCT CardYear FROM Card";
        let conditions = [];
        let values = [];

        if (sport) {
            conditions.push("Sport = ?");
            values.push(sport);
        }
        if (cardSet) {
            conditions.push("CardSet = ?");
            values.push(cardSet);
        }
        if (cardColor) {
            conditions.push("CardColor = ?");
            values.push(cardColor);
        }
        if (cardVariant) {
            conditions.push("CardVariant = ?");
            values.push(cardVariant);
        }
        if (team) {
            conditions.push("Team = ?");
            values.push(team);
        }
        if (numbered) {
            conditions.push("Numbered = ?");
            values.push(numbered);
        }
        if (colorPattern) {
            conditions.push("ColorPattern = ?");
            values.push(colorPattern);
        }
        if (auto) {
            conditions.push("Auto = ?");
            values.push(auto);
        }

        if (conditions.length) {
            query += " WHERE " + conditions.join(" AND ");
        }
        query += " ORDER BY CardYear DESC";

        const years = await db.query(query, values);
        res.json(years.map(row => row.CardYear));
    } catch (error) {
        console.error('Error fetching years:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/sports', authenticateToken, notificationCounts, async (req, res) => {
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';

    try {
        let query = "SELECT DISTINCT Sport FROM Card";
        let conditions = [];
        let values = [cardSet, year, cardColor, cardVariant, team, numbered, colorPattern, auto].filter(value => value);

        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");
        if (cardVariant) conditions.push("CardVariant = ?");
        if (team) conditions.push("Team = ?");
        if (numbered) conditions.push("Numbered = ?");
        if (colorPattern) conditions.push("ColorPattern = ?");
        if (auto) conditions.push("Auto = ?");

        if (conditions.length) query += " WHERE " + conditions.join(" AND ");
        query += " ORDER BY Sport";

        const sports = await db.query(query, values);
        res.json(sports.map(row => row.Sport));
    } catch (error) {
        console.error(`Error fetching sports:`, error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/cardcolors', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardVariant = req.query.cardVariant || '';
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';

    try {
        let query = "SELECT DISTINCT CardColor FROM Card WHERE CardColor IS NOT NULL";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardVariant) conditions.push("CardVariant = ?");
        if (team) conditions.push("Team = ?");
        if (numbered) conditions.push("Numbered = ?");
        if (colorPattern) conditions.push("ColorPattern = ?");
        if (auto) conditions.push("Auto = ?");

        values = [sport, cardSet, year, cardVariant, team, numbered, colorPattern, auto].filter(value => value !== '');

        if (values.length) {
            query += " AND " + conditions.join(" AND ");
        }

        query += " ORDER BY CardColor";
        const cardColors = await db.query(query, values);
        res.json(cardColors.map(row => row.CardColor));
    } catch (error) {
        console.error('Error fetching card colors:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/cardvariants', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';

    try {
        let query = "SELECT DISTINCT CardVariant FROM Card";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");
        if (team) conditions.push("Team = ?");
        if (numbered) conditions.push("Numbered = ?");
        if (colorPattern) conditions.push("ColorPattern = ?");
        if (auto) conditions.push("Auto = ?");

        values = [sport, cardSet, year, cardColor, team, numbered, colorPattern, auto].filter(value => value !== '');

        if (values.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY CardVariant";
        const cardVariants = await db.query(query, values);
        res.json(cardVariants.map(row => row.CardVariant));
    } catch (error) {
        console.error('Error fetching card variants:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/teams', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';

    try {
        let query = "SELECT DISTINCT Team FROM Card";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");
        if (cardVariant) conditions.push("CardVariant = ?");
        if (numbered) conditions.push("Numbered = ?");
        if (colorPattern) conditions.push("ColorPattern = ?");
        if (auto) conditions.push("Auto = ?");

        values = [sport, cardSet, year, cardColor, cardVariant, numbered, colorPattern, auto].filter(value => value !== '');

        if (values.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY Team";
        const teams = await db.query(query, values);
        res.json(teams.map(row => row.Team));
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/numbered', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const team = req.query.team || '';
    const colorPattern = req.query.colorPattern || '';
    const auto = req.query.auto || '';

    try {
        let query = "SELECT DISTINCT Numbered FROM Card";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");
        if (cardVariant) conditions.push("CardVariant = ?");
        if (team) conditions.push("Team = ?");
        if (colorPattern) conditions.push("ColorPattern = ?");
        if (auto) conditions.push("Auto = ?");

        values = [sport, cardSet, year, cardColor, cardVariant, team, colorPattern, auto].filter(value => value !== '');

        if (values.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY Numbered";
        const numberedOptions = await db.query(query, values);
        res.json(numberedOptions.map(row => row.Numbered));
    } catch (error) {
        console.error('Error fetching numbered options:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/colorpatterns', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const auto = req.query.auto || '';

    try {
        let query = "SELECT DISTINCT ColorPattern FROM Card";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");
        if (cardVariant) conditions.push("CardVariant = ?");
        if (team) conditions.push("Team = ?");
        if (numbered) conditions.push("Numbered = ?");
        if (auto) conditions.push("Auto = ?");

        values = [sport, cardSet, year, cardColor, cardVariant, team, numbered, auto].filter(value => value !== '');

        if (values.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY ColorPattern";
        const colorPatterns = await db.query(query, values);
        res.json(colorPatterns.map(row => row.ColorPattern));
    } catch (error) {
        console.error('Error fetching color patterns:', error);
        res.status(500).send('Server error');
    }
});

// Route to fetch auto options
router.get('/admin/auto', authenticateToken, notificationCounts, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const team = req.query.team || '';
    const numbered = req.query.numbered || '';
    const colorPattern = req.query.colorPattern || '';

    try {
        let query = "SELECT DISTINCT Auto FROM Card";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");
        if (cardVariant) conditions.push("CardVariant = ?");
        if (team) conditions.push("Team = ?");
        if (numbered) conditions.push("Numbered = ?");
        if (colorPattern) conditions.push("ColorPattern = ?");

        values = [sport, cardSet, year, cardColor, cardVariant, team, numbered, colorPattern].filter(value => value !== '');

        if (values.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY Auto";
        const autoOptions = await db.query(query, values);
        res.json(autoOptions.map(row => row.Auto));
    } catch (error) {
        console.error('Error fetching auto options:', error);
        res.status(500).send('Server error');
    }
});


// Endpoint for full search
router.get('/admin/search-card-sets', authenticateToken, notificationCounts, async (req, res) => {
    const { term, sport, year, cardColor, cardVariant } = req.query;
    // Generate a unique cache key based on the search parameters
    const cacheKey = `search:cardsets:${term}:${sport}:${year}:${cardColor}:${cardVariant}`;

    try {
        // Attempt to fetch the result from cache first
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            // If data is found in cache, parse it and return
            return res.json(JSON.parse(cachedData));
        }

        // If no data in cache, proceed with the database query
        let query = "SELECT DISTINCT CardSet FROM Card WHERE CardSet LIKE ?";
        let values = [`${term}%`]; // Search term at the beginning

        // Append conditions for each filter
        if (sport) {
            query += " AND Sport = ?";
            values.push(sport);
        }
        if (year) {
            query += " AND CardYear = ?";
            values.push(year);
        }
        if (cardColor) {
            query += " AND CardColor = ?";
            values.push(cardColor);
        }
        if (cardVariant) {
            query += " AND CardVariant = ?";
            values.push(cardVariant);
        }

        // Add ORDER BY clause here to sort the results alphabetically by CardSet
        query += " ORDER BY CardSet ASC";

        // Execute the database query
        const result = await db.query(query, values);
        const cardSets = result.map(row => row.CardSet);

        // Cache the result for future requests
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(cardSets)); // Cache for 1 hour

        // Return the query result
        res.json(cardSets);
    } catch (error) {
        console.error('Error searching card sets:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/update-inventory-pricing', authenticateToken, notificationCounts, async (req, res) => {
    const cardId = req.query.cardId;
    const sellerId = req.user.id;

    try {
        // Fetch all inventory items for the given CardID and SellerID
        const inventoryQuery = 'SELECT * FROM Inventory WHERE CardID = ? AND SellerID = ?';
        const inventoryItems = await db.query(inventoryQuery, [cardId, sellerId]);

        // Fetch the card details
        const cardDetailsQuery = 'SELECT CardID, CardName, CardSet, CardYear, CardNumber, CardColor, CardVariant, CardImage, Team, Numbered, ColorPattern, Auto FROM Card WHERE CardID = ?';
        const cardDetails = await db.query(cardDetailsQuery, [cardId]);

        // Fetch grade options based on CardID, in descending order
        const gradesQuery = 'SELECT GradeID, GradeValue FROM Grade WHERE CardID = ? ORDER BY GradeValue DESC';
        const grades = await db.query(gradesQuery, [cardId]);

        // Render the page with fetched data
        res.render('update_inventory', {
            existingInventory: inventoryItems, // Pass the entire array of items
            cardDetails: cardDetails.length > 0 ? cardDetails[0] : {},
            grades: grades,
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});


router.post('/admin/submit-inventory', authenticateToken, notificationCounts, async (req, res) => {
    const { action, cardId, listingIds = [], gradeIds = [], salePrices = [], certNumbers = [] } = req.body;
    const sellerId = req.user.id;
    const defaultImageUrl = '/images/defaultPSAImage.png';

    // Check if the action is to clear the inventory
    if (action === 'clearInventory') {
        try {
            // Delete all inventory items for the given CardID and SellerID
            const deleteQuery = 'DELETE FROM Inventory WHERE CardID = ? AND SellerID = ?';
            await db.query(deleteQuery, [cardId, sellerId]);
            // Redirect after clearing the inventory
            return res.redirect('/admin/inventory');
        } catch (error) {
            console.error('Error clearing inventory:', error);
            return res.status(500).send('Error clearing inventory');
        }
    }

    // Continue with adding/updating inventory if the action is not to clear
    try {
        for (let i = 0; i < gradeIds.length; i++) {
            const listingId = listingIds[i];
            const gradeId = gradeIds[i];
            const salePrice = salePrices[i];
            const certNumber = certNumbers[i];

            let frontImageUrl = null;
            let backImageUrl = null;

            if (certNumber) {
                const images = await getImagesByCertNumber(certNumber, process.env.PSA_API_KEY, process.env.PSA_ACCESS_TOKEN);
                frontImageUrl = images.frontImageUrl;
                backImageUrl = images.backImageUrl;

                if (frontImageUrl && frontImageUrl !== defaultImageUrl) {
                    await updateCardImage(cardId, frontImageUrl, defaultImageUrl);
                }
            }
            if (listingId) {
                const updateQuery = 'UPDATE Inventory SET FrontImageUrl = ?, BackImageUrl = ? WHERE ListingID = ? AND CardID = ?';
                await db.query(updateQuery, [frontImageUrl, backImageUrl, listingId, cardId]);
            } else {
                const insertQuery = 'INSERT INTO Inventory (CardID, GradeID, SalePrice, CertNumber, FrontImageUrl, BackImageUrl, SellerID) VALUES (?, ?, ?, ?, ?, ?, ?)';
                await db.query(insertQuery, [cardId, gradeId, salePrice, certNumber, frontImageUrl, backImageUrl, sellerId]);
            }
        }

        return res.redirect('/admin/inventory?success=true');
    } catch (err) {
        console.error('Error processing inventory submission:', err);
        return res.status(500).send('Error processing inventory');
    }
});

// Function to get card data by cert number from the API
async function getCardDataByCertNumber(certNumber, apiKey, accessToken) {
    const url = `https://api.psacard.com/publicapi/cert/GetByCertNumber/${certNumber}`; // Correct variable is 'url'
    try {
        const response = await axios.get(url, { // This should be 'url', not 'endpoint'
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}` // Assuming accessToken is the correct way to authenticate
            }
        });

        if (response.data && response.data.PSACert) {
            const { PSACert } = response.data;
            return {
                year: PSACert.Year,
                brand: PSACert.Brand,
                cardNumber: PSACert.CardNumber,
                cardGrade: PSACert.CardGrade,
                subject: PSACert.Subject,
                variety: PSACert.Variety
            };
        }

        return null; // Or handle as appropriate if no data found
    } catch (error) {
        console.error('Error fetching card data from API:', error);
        throw error;
    }
}


// Function to get images by cert number from PSA Card API
async function getImagesByCertNumber(certNumber, apiKey, accessToken) {
    const endpoint = `https://api.psacard.com/publicapi/cert/GetImagesByCertNumber/${certNumber}`;
    try {
        const response = await axios.get(endpoint, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}` // Replace with actual access token
            }
        });

        // Check if the response contains images
        if (response.data && response.data.length > 0) {
            // Extract the image URLs
            const frontImage = response.data.find(image => image.IsFrontImage)?.ImageURL;
            const backImage = response.data.find(image => !image.IsFrontImage)?.ImageURL;
            return { frontImageUrl: frontImage, backImageUrl: backImage };
        }

        return { frontImageUrl: null, backImageUrl: null };
    } catch (error) {
        console.error('Error fetching images from PSA Card API:', error);
        throw error; // Or handle this error as appropriate for your application
    }
}

async function updateCardImage(cardId, newImageUrl, defaultImageUrl) {
    // Include a condition to check if the current CardImage is the default one
    const query = "UPDATE Card SET CardImage = ? WHERE CardID = ? AND CardImage = ?";
    const values = [newImageUrl, cardId, defaultImageUrl]; // Include the default image URL in the values

    try {
        const result = await db.query(query, values);
        return result.affectedRows > 0; // Returns true if the row was updated, false otherwise
    } catch (error) {
        console.error('Error updating CardImage:', error);
        throw error; // Rethrow the error to handle it further up the call stack
    }
}

router.get('/api/fetch-card-data', authenticateToken, notificationCounts, async (req, res) => {
    const { certNumber } = req.query;
    if (!certNumber) {
        return res.status(400).send({ error: 'Cert number is required.' });
    }

    try {
        const cardData = await getCardDataByCertNumber(req.query.certNumber, process.env.PSA_API_KEY, process.env.PSA_ACCESS_TOKEN);
        if (cardData) {
            res.json(cardData);
        } else {
            res.status(404).send({ error: 'Card data not found.' });
        }
    } catch (error) {
        console.error('Error fetching card data:', error);
        res.status(500).send({ error: 'Server error fetching card data.' });
    }
});


// Add this endpoint to your server
router.get('/fetch-card-image', authenticateToken, notificationCounts, async (req, res) => {
    const { certNumber } = req.query;
    if (!certNumber) {
        return res.status(400).send({ error: 'Cert number is required.' });
    }

    try {
        const images = await getImagesByCertNumber(certNumber, process.env.PSA_API_KEY, process.env.PSA_ACCESS_TOKEN);
        if (images.frontImageUrl || images.backImageUrl) {
            res.json(images);
        } else {
            res.status(404).send({ error: 'Images not found.' });
        }
    } catch (error) {
        console.error('Error fetching card images:', error);
        res.status(500).send({ error: 'Server error fetching images.' });
    }
});

router.get('/admin/orders', authenticateToken, notificationCounts, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const sellerId = req.user.id;

    try {
        const query = `
            SELECT Orders.OrderNumber, Orders.SalePrice, Orders.OrderDate, 
                   Addresses.FirstName, Addresses.LastName, Shipping.ShipmentStatus
            FROM Orders
            LEFT JOIN Addresses ON Orders.AddressID = Addresses.AddressID
            LEFT JOIN Shipping ON Orders.OrderNumber = Shipping.OrderNumber
            WHERE Orders.SellerID = ?
            ORDER BY 
                CASE 
                    WHEN Shipping.ShipmentStatus = 'Awaiting shipment' THEN 1
                    ELSE 2
                END,
                Orders.OrderDate DESC
            LIMIT ? OFFSET ?
        `;
        const orders = await db.query(query, [sellerId, limit, offset]);

        console.log("Fetched Orders:", orders);  // Log the fetched orders for debugging

        const countQuery = 'SELECT COUNT(*) AS totalOrders FROM Orders WHERE SellerID = ?';
        const totalResult = await db.query(countQuery, [sellerId]);
        const totalOrders = totalResult[0].totalOrders;
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('orders', {
            orders,
            totalOrders,
            page,
            totalPages,
            limit
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server error');
    }
});


router.get('/admin/order-details', authenticateToken, notificationCounts, async (req, res) => {
    const orderNumber = req.query.orderNumber;
    try {
        const orderDetailsQuery = `
        SELECT 
            Orders.OrderNumber, Orders.OrderDate, Orders.SalePrice, Orders.ShippingPrice,
            Orders.FeeAmount, Orders.NetAmount, Orders.OrderAmount,
            Addresses.FirstName, Addresses.LastName, Addresses.Street, Addresses.City,
            Addresses.State, Addresses.ZipCode, Addresses.Country,
            Orders.BuyerID -- Ensure BuyerID is selected
        FROM Orders
        JOIN Addresses ON Orders.AddressID = Addresses.AddressID
        WHERE Orders.OrderNumber = ?
    `;

        const orderDetails = await db.query(orderDetailsQuery, [orderNumber]);

        const orderItemsQuery = `
            SELECT 
                OrderItems.ListingID, 
                OrderItems.Quantity, 
                OrderItems.Price,
                Card.CardID,
                Card.Sport, 
                Card.CardSet, 
                Card.CardYear, 
                Card.CardName, 
                Card.CardColor, 
                Card.CardVariant,
                Card.Team, 
                Card.Numbered, 
                Card.ColorPattern, 
                Card.Auto
            FROM OrderItems
            JOIN Orders ON OrderItems.OrderNumber = Orders.OrderNumber
            LEFT JOIN Card ON OrderItems.CardID = Card.CardID
            WHERE Orders.OrderNumber = ?
        `;
        const items = await db.query(orderItemsQuery, [orderNumber]);
        const processedItems = items.map(item => {
            const cardDetailsParts = [
                item.Sport,
                item.CardSet,
                item.CardYear,
                item.CardName,
                item.CardColor,
                item.CardVariant,
                item.Team,
                item.Numbered,
                item.ColorPattern,
                item.Auto ? "Auto" : ""
            ].filter(part => part).join(' - ');
            return { ...item, CardDetails: cardDetailsParts };
        });

        const feedbackQuery = 'SELECT * FROM Feedback WHERE OrderNumber = ?';
        const feedback = await db.query(feedbackQuery, [orderNumber]);

        const shippingQuery = 'SELECT * FROM Shipping WHERE OrderNumber = ?';
        const shipping = await db.query(shippingQuery, [orderNumber]);

        res.render('order-details', {
            order: orderDetails[0] || {}, // Make sure there's a fallback if no data
            items: processedItems,
            feedback: feedback[0] || null,
            shipping: shipping[0] || null,
            address: {
                FirstName: orderDetails[0]?.FirstName,
                LastName: orderDetails[0]?.LastName,
                Street: orderDetails[0]?.Street,
                City: orderDetails[0]?.City,
                State: orderDetails[0]?.State,
                ZipCode: orderDetails[0]?.ZipCode,
                Country: orderDetails[0]?.Country
            }
        });
        
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Error fetching order details');
    }
});


router.post('/admin/update-shipping-details', authenticateToken, notificationCounts, async (req, res) => {
    const { orderNumber, ShippedWithTracking, TrackingNumber, EstimatedDeliveryDate, Carrier, CarrierTrackingURL, ShipmentStatus } = req.body;

    try {
        const updateShippingQuery = `
            UPDATE Shipping
            SET 
                Shipping.ShippedWithTracking = ?, 
                Shipping.TrackingNumber = ?, 
                Shipping.EstimatedDeliveryDate = ?, 
                Shipping.Carrier = ?, 
                Shipping.CarrierTrackingURL = ?, 
                Shipping.ShipmentStatus = ?
            WHERE Shipping.OrderNumber = ?
        `;

        const result = await db.query(updateShippingQuery, [ShippedWithTracking, TrackingNumber, EstimatedDeliveryDate, Carrier, CarrierTrackingURL, ShipmentStatus, orderNumber]);
        console.log(result);

        res.json({ message: 'Shipping details updated successfully' });
    } catch (error) {
        console.error('Error updating shipping details:', error);
        res.status(500).send('Error updating shipping details');
    }
});


router.get('/admin/messages', authenticateToken, notificationCounts, async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    try {
        // Query to get the conversations count for the active user as a seller or buyer
        const countQuery = `
            SELECT COUNT(DISTINCT c.ConversationID) AS conversationCount
            FROM Conversations c
            INNER JOIN Messages m ON c.ConversationID = m.ConversationID
            INNER JOIN Users u ON m.SenderID = u.UserID
            INNER JOIN Addresses a ON u.UserID = a.UserID
            WHERE c.SellerID = ? OR c.BuyerID = ?
        `;
        const [countResult] = await db.query(countQuery, [userId, userId]);
        const conversationCount = Array.isArray(countResult) ? countResult[0].conversationCount : countResult.conversationCount;
        const totalPages = Math.ceil(conversationCount / limit);

        // Query to get the latest messages and related data, including OrderNumber instead of LatestMessageID
        const latestMessagesQuery = `
            SELECT 
                c.ConversationID,
                c.Subject,
                c.OrderNumber,  
                m.SenderID,
                CONCAT(a.FirstName, ' ', a.LastName) AS SenderName,
                m.MessageText,
                m.Timestamp,
                m.IsRead
            FROM Conversations c
            INNER JOIN (
                SELECT 
                    ConversationID, 
                    MAX(MessageID) AS LatestMessageID
                FROM Messages
                GROUP BY ConversationID
            ) lm ON c.ConversationID = lm.ConversationID
            INNER JOIN Messages m ON lm.LatestMessageID = m.MessageID
            INNER JOIN Users u ON m.SenderID = u.UserID
            INNER JOIN Addresses a ON u.UserID = a.UserID
            WHERE c.SellerID = ? OR c.BuyerID = ?
            ORDER BY m.Timestamp DESC
            LIMIT ? OFFSET ?`;

        const conversations = await db.query(latestMessagesQuery, [userId, userId, limit, offset]);

        // Pass the conversations count along with other data to the template
        res.render('messages', {
            conversationsWithMessages: conversations,
            conversationCount: conversationCount,
            page: page,
            limit: limit,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching conversations with latest messages:', error);
        res.status(500).send('Server error');
    }
});


router.get('/admin/message-details/:conversationId', authenticateToken, notificationCounts, async (req, res) => {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    try {
        // Update the IsRead status for messages in the conversation
        const updateQuery = `UPDATE Messages SET IsRead = 1 WHERE ConversationID = ? AND SenderID != ?`;
        await db.query(updateQuery, [conversationId, userId]);

        // Fetch messages and conversation details, now using first name and last name
        const conversationAndMessagesQuery = `
            SELECT m.MessageID, m.SenderID, m.MessageText, m.Timestamp, 
                   CONCAT(a.FirstName, ' ', a.LastName) AS SenderName,
                   c.Subject, c.SellerID, c.BuyerID, o.OrderNumber
            FROM Messages m
            JOIN Users u ON m.SenderID = u.UserID
            JOIN Addresses a ON u.UserID = a.UserID AND a.IsPrimary = 1  
            JOIN Conversations c ON m.ConversationID = c.ConversationID
            LEFT JOIN Orders o ON c.OrderNumber = o.OrderNumber
            WHERE m.ConversationID = ?
            ORDER BY m.Timestamp ASC`;

        let messages = await db.query(conversationAndMessagesQuery, [conversationId]);

        if (!messages.length) {
            return res.status(404).send('Conversation not found');
        }

        const conversation = {
            Subject: messages[0].Subject,
            SellerID: messages[0].SellerID,
            BuyerID: messages[0].BuyerID,
            OrderNumber: messages[0].OrderNumber
        };

        res.render('message-details', {
            userId,
            conversationId,
            conversation,
            messages: messages.map(message => ({
                ...message,
                isFromSeller: message.SenderID === conversation.SellerID, // Check if the message is from the seller
            }))
        });
    } catch (error) {
        console.error('Error fetching conversation details:', error);
        res.status(500).send('Server error');
    }
});

router.post('/admin/send-message', authenticateToken, notificationCounts, async (req, res) => {
    const { conversationId, messageText } = req.body;
    const userId = req.user.id;

    try {
        // Fetch the conversation to get BuyerID and SellerID
        const conversationQuery = `SELECT SellerID, BuyerID FROM Conversations WHERE ConversationID = ?`;
        const [conversation] = await db.query(conversationQuery, [conversationId]);

        if (!conversation) {
            return res.status(404).send('Conversation not found');
        }

        const senderId = userId; // Sender is the current logged-in user

        const insertMessageQuery = `
            INSERT INTO Messages (ConversationID, SenderID, MessageText, Timestamp, IsRead, ResponseNeeded)
            VALUES (?, ?, ?, NOW(), 0, FALSE)`;
        await db.query(insertMessageQuery, [conversationId, senderId, messageText]);

        // Redirect back to the message-details page or handle as needed
        res.redirect(`/admin/message-details/${conversationId}`);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Error sending message');
    }
});

// Helper function to fetch BuyerID based on conversationId
async function fetchBuyerIdFromConversation(conversationId) {
    const query = `SELECT BuyerID FROM Conversations WHERE ConversationID = ?`;
    const results = await db.query(query, [conversationId]);
    return results[0]; // Assuming there's always a valid result
}

router.post('/admin/create-or-find-conversation', authenticateToken, notificationCounts, async (req, res) => {
    const { orderNumber, buyerId, subject: receivedSubject, message } = req.body;
    const sellerId = req.user.id;

    const allowedSubjects = ['General Message', 'Request To Cancel', 'Condition Issue', 'Item Never Arrived', 'Change Address', 'Items Missing', 'Received Wrong Item(s)'];
    const subject = allowedSubjects.includes(receivedSubject) ? receivedSubject : 'General Message';

    try {
        let query = `SELECT ConversationID FROM Conversations WHERE OrderNumber = ? AND BuyerID = ? AND SellerID = ? LIMIT 1`;
        let [existingConversation] = await db.query(query, [orderNumber, buyerId, sellerId]);

        let conversationId;
        if (!existingConversation) {
            query = `INSERT INTO Conversations (OrderNumber, SellerID, BuyerID, Subject) VALUES (?, ?, ?, ?)`;
            const result = await db.query(query, [orderNumber, sellerId, buyerId, subject]);
            conversationId = result.insertId;
        } else {
            conversationId = existingConversation.ConversationID;
        }

        // Insert the message with isRead set to 1 and correct SenderID
        query = `INSERT INTO Messages (ConversationID, SenderID, MessageText, IsRead) VALUES (?, ?, ?, ?)`;
        const senderId = req.user.id === sellerId ? sellerId : buyerId;
        await db.query(query, [conversationId, senderId, message, 1]);

        res.json({ conversationId });
    } catch (error) {
        console.error('Error creating or finding conversation:', error);
        res.status(500).send('Error processing request');
    }
});

async function getOrderDetails(orderNumber) {
    try {
        // Fetch basic order details, including buyer and seller names from the updated schema
        let orderSql = `
        SELECT 
        o.OrderNumber, 
        o.OrderDate, 
        o.SalePrice AS TotalPrice,
        CONCAT(a.FirstName, ' ', a.LastName) AS BuyerName,
        s.StoreName AS SellerName,
        a.Street, 
        a.City, 
        a.State, 
        a.ZipCode, 
        a.Country
    FROM Orders o
    JOIN Users buyer ON o.BuyerID = buyer.UserID
    JOIN Addresses a ON buyer.UserID = a.UserID
    JOIN Users seller ON o.SellerID = seller.UserID
    JOIN Stores s ON seller.UserID = s.UserID
    WHERE o.OrderNumber = ?
    `;

        const orderDetails = await db.query(orderSql, [orderNumber]);
        if (orderDetails.length === 0) {
            return null;
        }

        // Assuming the first result contains the main order details
        const mainOrderDetails = orderDetails[0];

        // Fetch details for each item in the order
        let itemsSql = `
            SELECT oi.Quantity, oi.Price, c.CardName, c.CardNumber, c.CardColor,
                   c.CardVariant, c.Sport, c.CardYear, c.CardSet,
                   c.Team, c.Numbered, c.ColorPattern, c.Auto
            FROM OrderItems oi
            JOIN Card c ON oi.CardID = c.CardID
            WHERE oi.OrderNumber = ?`;

        const itemsDetails = await db.query(itemsSql, [orderNumber]);

        // Combine everything into a single object
        const finalOrderDetails = {
            orderNumber: mainOrderDetails.OrderNumber,
            orderDate: mainOrderDetails.OrderDate,
            totalPrice: mainOrderDetails.TotalPrice,
            buyerName: mainOrderDetails.BuyerName,
            sellerName: mainOrderDetails.SellerName,
            shippingAddress: {
                Street: mainOrderDetails.Street,
                City: mainOrderDetails.City,
                State: mainOrderDetails.State,
                ZipCode: mainOrderDetails.ZipCode,
                Country: mainOrderDetails.Country,
            },
            items: itemsDetails
        };

        return finalOrderDetails;
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error; // Rethrow the error or handle it as needed
    }
}

router.get('/admin/download-order', authenticateToken, notificationCounts, async (req, res) => {
    const orderNumber = req.query.orderNumber;

    try {
        const orderDetails = await getOrderDetails(orderNumber);
        if (!orderDetails) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment;filename=packingSlip-${orderNumber}.pdf`);
        doc.pipe(res);

        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        };
        doc.moveUp(1);

        // Header
        doc.fontSize(12).font('Helvetica-Bold').text('Ship To:');
        doc.moveDown(0.5);
        doc.fontSize(14).text(`${orderDetails.buyerName.toUpperCase()}`);
        doc.text(`${orderDetails.shippingAddress.Street.toUpperCase()}`);
        doc.text(`${orderDetails.shippingAddress.City.toUpperCase()}, ${orderDetails.shippingAddress.State.toUpperCase()}, ${orderDetails.shippingAddress.ZipCode.toUpperCase()}`);
        //doc.text(`${orderDetails.shippingAddress.Country.toUpperCase()}`);
        doc.moveDown(2);

        // Order Details
        doc.fontSize(12).font('Helvetica-Bold')
            .text(`Order Number: ${orderDetails.orderNumber}`, 50)
            .text(`Order Date: ${formatDate(orderDetails.orderDate)}`)
            .text(`Seller Name: ${orderDetails.sellerName}`)
            .moveDown(2);

        // Items Table
        const startX = doc.x;
        let startY = doc.y;
        const pageWidth = doc.page.width - 2 * doc.x; // Calculate page width based on current doc.x position
        doc.fontSize(10);

        // Define column positions based on your page layout
        const quantityWidth = 50;
        const descriptionWidth = pageWidth - 2 * quantityWidth - 2 * startX;
        const priceWidth = quantityWidth;

        // Table Headers
        doc.font('Helvetica-Bold');
        doc.text('Quantity', startX, startY, { width: quantityWidth, align: 'center' });
        doc.text('Description', startX + quantityWidth, startY, { width: descriptionWidth, align: 'left' });
        doc.text('Price', startX + quantityWidth + descriptionWidth, startY, { width: priceWidth, align: 'right' });
        doc.text('Total', startX + quantityWidth + descriptionWidth + priceWidth, startY, { width: priceWidth, align: 'right' });
        startY += 20;

        // Reset font to normal for table entries
        doc.font('Helvetica');

        // Loop through items and add them to the table
        orderDetails.items.forEach(item => {
            const quantity = parseFloat(item.Quantity);
            const price = parseFloat(item.Price);
            if (isNaN(quantity) || isNaN(price)) {
                console.error('Invalid item quantity or price:', item);
                return; // Skip invalid items
            }

            const itemTotalPrice = (quantity * price).toFixed(2);
            const cardDescription = [
                item.CardName, 
                item.CardNumber, 
                item.CardColor, 
                item.CardVariant, 
                item.Sport, 
                item.CardYear, 
                item.CardSet, 
                item.Team, 
                item.Numbered, 
                item.ColorPattern, 
                item.Auto ? "Auto" : ""
            ].filter(part => part).join(' ');

            // Handle text wrapping for card description
            const wrappedDescriptionHeight = doc.heightOfString(cardDescription, {
                width: descriptionWidth,
                align: 'left'
            });

            doc.text(quantity, startX, startY, { width: quantityWidth, align: 'center' });
            doc.text(cardDescription, startX + quantityWidth, startY, { width: descriptionWidth, align: 'left' });
            doc.text(`$${price.toFixed(2)}`, startX + quantityWidth + descriptionWidth, startY, { width: priceWidth, align: 'right' });
            doc.text(`$${itemTotalPrice}`, startX + quantityWidth + descriptionWidth + priceWidth, startY, { width: priceWidth, align: 'right' });
            startY += wrappedDescriptionHeight + 20; // Adjust Y position based on wrapped text height
        });

        // Ensure totalPrice is a number and draw total price below all items
        const totalPrice = parseFloat(orderDetails.totalPrice);
        if (isNaN(totalPrice)) {
            console.error('Invalid total price:', orderDetails.totalPrice);
            return res.status(500).send('Internal Server Error');
        }
        startY += 20; // Add a bit of space before the total
        doc.text(`Total: $${totalPrice.toFixed(2)}`, startX + quantityWidth + descriptionWidth + priceWidth, startY, { width: priceWidth, align: 'right' });

        doc.end();
    } catch (error) {
        console.error('Error during PDF generation:', error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/admin/feedback', authenticateToken, notificationCounts, async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    try {
        // Fetch FeedbackAverage from Stores
        const feedbackAverageQuery = `SELECT FeedbackAverage FROM Stores WHERE UserID = ?`;
        const [averageResult] = await db.query(feedbackAverageQuery, [userId]);
        const feedbackAverage = averageResult ? averageResult.FeedbackAverage : null;

        // Count total feedback for pagination
        const countQuery = `SELECT COUNT(*) AS feedbackCount FROM Feedback WHERE SellerID = ?`;
        const [countResult] = await db.query(countQuery, [userId]);
        const feedbackCount = countResult.feedbackCount;
        const totalPages = Math.ceil(feedbackCount / limit);

        const feedbackQuery = `
            SELECT 
                f.FeedbackID, 
                f.SellerID, 
                f.BuyerID, 
                CONCAT(a.FirstName, ' ', a.LastName) AS BuyerName, 
                f.FeedbackText, 
                f.Rating, 
                f.FeedbackDate, 
                f.OrderNumber,
                o.OrderDate
            FROM Feedback f
            INNER JOIN Orders o ON f.OrderNumber = o.OrderNumber
            INNER JOIN Addresses a ON f.BuyerID = a.UserID
            WHERE f.SellerID = ?
            ORDER BY f.FeedbackDate DESC
            LIMIT ? OFFSET ?`;
        const feedbackResults = await db.query(feedbackQuery, [userId, limit, offset]);

        // Extract feedback from the query results
        const feedback = Array.isArray(feedbackResults) ? feedbackResults : feedbackResults[0];

        const feedbackStats = await getFeedbackStats(userId);

        res.render('feedback', {
            feedback: feedback,
            feedbackCount: feedbackCount,
            feedbackAverage: feedbackAverage,
            page: page,
            limit: limit,
            feedbackStats: feedbackStats,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).send('Server error');
    }
});


const intervals = [
    { key: '30 Days', value: '30 DAY' },
    { key: '90 Days', value: '90 DAY' },
    { key: '365 Days', value: '365 DAY' },
    { key: 'Lifetime', value: '10000 DAY' } // Using 'lifetime' as a more readable label
];

async function getFeedbackStats(sellerId) {
    const stats = {};
    for (let interval of intervals) {
        const queryString = `
            SELECT
                SUM(CASE WHEN Rating IN (4, 5) THEN 1 ELSE 0 END) AS 'Positive',
                SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) AS 'Neutral',
                SUM(CASE WHEN Rating IN (1, 2) THEN 1 ELSE 0 END) AS 'Negative'
            FROM Feedback
            WHERE SellerID = ? AND FeedbackDate >= CURDATE() - INTERVAL ${interval.value}`;
        const result = await db.query(queryString, [sellerId]);
        // Ensuring we handle potentially undefined results correctly
        const firstRow = result[0] ?? {};
        stats[interval.key] = {
            Positive: firstRow.Positive ?? 0,
            Neutral: firstRow.Neutral ?? 0,
            Negative: firstRow.Negative ?? 0
        };
    }
    return stats;
}

router.get('/admin/payments', authenticateToken, notificationCounts, async (req, res) => {
    const sellerId = req.user.id; // Assuming req.user.id contains the unique SellerID

    try {
        const query = `
            SELECT 
                DATE_FORMAT(MIN(OrderDate), '%m/%d/%Y') AS WeekStartDate,
                DATE_FORMAT(MAX(OrderDate) + INTERVAL 6 DAY, '%m/%d/%Y') AS WeekEndDate,
                SUM(SalePrice) AS TotalSalePrice,
                SUM(ShippingPrice) AS TotalShippingPrice,
                SUM(OrderAmount) AS TotalOrderAmount,
                SUM(FeeAmount) AS TotalFeeAmount,
                SUM(NetAmount) AS TotalNetAmount
            FROM Orders
            WHERE 
                SellerID = ? AND
                OrderDate BETWEEN CURDATE() - INTERVAL 28 DAY AND CURDATE()
            GROUP BY YEARWEEK(OrderDate)
            ORDER BY WeekStartDate ASC;
        `;

        // Execute the query
        const results = await db.query(query, [sellerId]);
        // Ensure the result is in the format of an array of objects
        const paymentData = Array.isArray(results[0]) ? results[0] : [results[0]];

        // Pass the array to the Handlebars template
        res.render('payments', {
            paymentData: paymentData
        });
    } catch (error) {
        console.error('Error fetching payment data:', error);
        res.status(500).send('Server error');
    }
});

router.get('/admin/reports', authenticateToken, notificationCounts, async (req, res) => {
    const { startDate, endDate } = req.query;

    console.log(`Received startDate: ${startDate}, endDate: ${endDate}`);

    if (!startDate || !endDate) {
        console.log('No startDate or endDate provided, rendering initial page.');
        return res.render('reports', {
            salesData: null,
            startDate: '',
            endDate: ''
        });
    }

    // Adjust endDate to include the full day
    const adjustedEndDate = endDate + ' 23:59:59';

    try {
        const sql = `
            SELECT 
                SUM(SalePrice) AS totalSalePrice, 
                SUM(ShippingPrice) AS totalShippingPrice, 
                COUNT(OrderNumber) AS totalOrderAmount, 
                SUM(FeeAmount) AS totalFeeAmount, 
                SUM(NetAmount) AS totalNetAmount 
            FROM Orders 
            WHERE SellerID = ? AND DATE(OrderDate) BETWEEN ? AND DATE(?)`;

        const params = [req.user.id, startDate, adjustedEndDate];
        console.log(`Executing SQL with params: ${params.join(', ')}`);

        const [results] = await db.query(sql, params);
        console.log(results); // Assuming this logs the RowDataPacket correctly

        // Directly using results if it already contains the correct structure.
        const salesData = results || {};
        console.log('Sales data fetched:', salesData);

        res.render('reports', {
            salesData,
            startDate,
            endDate
        });

    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).send('Server error');
    }
});


router.get('/admin/settings', authenticateToken, notificationCounts, async (req, res) => {
    const userId = req.user.id; // Assuming you're storing the user's ID in req.user

    try {
        const query = `
            SELECT Users.Email, Stores.StoreName, Stores.Description, 
            Addresses.Street, Addresses.Street2, Addresses.City, Addresses.State, 
            Addresses.ZipCode, Addresses.Country, BankInfo.AccountNumber, 
            BankInfo.AccountType, Stores.ShippingPrice
            FROM Users
            LEFT JOIN Stores ON Users.UserID = Stores.UserID
            LEFT JOIN Addresses ON Users.UserID = Addresses.UserID
            LEFT JOIN BankInfo ON Stores.StoreID = BankInfo.StoreID
            WHERE Users.UserID = ?`;

        const [sellerInfo] = await db.query(query, [userId]);
        if (sellerInfo.AccountNumber) {
            const maskedAccountNumber = sellerInfo.AccountNumber.slice(-4).padStart(sellerInfo.AccountNumber.length, 'X');
            sellerInfo.MaskedAccountNumber = maskedAccountNumber;
        }
        console.log(sellerInfo); // Add this line
        res.render('settings', { sellerInfo });
    } catch (error) {
        console.error('Error fetching seller info:', error);
        res.status(500).send('Server error');
    }
});

router.post('/admin/settings', authenticateToken, notificationCounts, async (req, res) => {
    const { shippingPrice, description, street, street2, city, state, zipCode, country } = req.body;
    const userId = req.user.id; // Assuming user's ID is stored in req.user
    if (description.length > 140) {
        // Handle the error, e.g., by re-rendering the form with an error message
        return res.render('settings', {
            error: 'Description must be 140 characters or fewer.',
            sellerInfo: req.body, // So they don't have to re-enter everything
        });
    }
    try {
        // Update Addresses table
        // Assume there's only one primary address per user for simplicity
        await db.query(`UPDATE Addresses SET Street = ?, Street2 = ?, City = ?, State = ?, ZipCode = ?, Country = ? WHERE UserID = ?`, [street, street2, city, state, zipCode, country, userId]);
        // Update Stores table
        await db.query(`UPDATE Stores SET Description = ? WHERE UserID = ?`, [description, userId]);
        // Update Shipping price
        await db.query(`UPDATE Stores SET ShippingPrice = ? WHERE UserID = ?`, [shippingPrice, userId]);

        res.redirect('settings');
    } catch (error) {
        console.error('Error updating seller info:', error);
        res.status(500).send('Server error');
    }
});





module.exports = router;