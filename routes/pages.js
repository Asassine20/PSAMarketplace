const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/middleware.js');
const db = require('../db');
const redis = require('redis');
const redisClient = redis.createClient();
const axios = require('axios');
redisClient.connect();

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
    //const sortColumn = req.query.sortColumn; 
    //const sortOrder = req.query.sortOrder; 
    const cacheKey = `inventory:${sellerId}:${page}:${limit}:${searchTerm}:${cardSet}:${cardYear}:${sport}:${cardColor}:${cardVariant}`;

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

        /*let orderByClause = '';
        if (sortColumn && sortOrder) {
            // Ensure the sort column and order are valid to prevent SQL injection
            const validSortColumns = ['Sport', 'CardName', 'CardSet', 'CardYear', 'CardNumber', 'CardColor', 'CardVariant'];
            const validSortOrder = ['asc', 'desc'];
            if (validSortColumns.includes(sortColumn) && validSortOrder.includes(sortOrder)) {
                orderByClause = ` ORDER BY ${sortColumn} ${sortOrder}`;
            } else {
                return res.status(400).send('Invalid sort parameters');
            }
        }
*/
        let query = "SELECT * FROM Card";
        if (whereConditions.length) {
            query += " WHERE " + whereConditions.join(" AND ");
        }

        //query += orderByClause; // Apply the dynamic ORDER BY clause
        query += " LIMIT ? OFFSET ?";
        values.push(limit, offset);

        // Similar logic for the countQuery (without ORDER BY and LIMIT/OFFSET)
        let countQuery = "SELECT COUNT(*) AS count FROM Card";
        if (whereConditions.length) {
            countQuery += " WHERE " + whereConditions.join(" AND ");
        }
        const countValues = [...values].slice(0, -2); // Exclude limit and offset for count query
        const cards = await db.query(query, values);

        const totalResult = await db.query(countQuery, countValues);
        const totalItems = totalResult[0].count; 
        const totalPages = Math.ceil(totalItems / limit);
        const startPage = Math.max(1, page - 2); // Show 2 pages before the current page
        const endPage = Math.min(totalPages, page + 2); // Show 2 pages after the current page
        
        // Generate page numbers for the pagination
        let pages = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);
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


        const cacheData = {
            ajaxData: {
                cards: updatedCards,
                currentPage: page,
                totalPages: totalPages,
                pages: pages,
                showPrevious: page > 1,
                showNext: page < totalPages,
                showFirst: page > 1,
                showLast: page < totalPages,
                totalItems: totalItems,
            },
            pageData: {
                username: req.user.username,
                cards: updatedCards,
                searchTerm,
                cardSet,
                cardYear,
                sport,
                cardSets: cardSetsData.map(row => row.CardSet),
                cardYears: cardYearsData.map(row => row.CardYear),
                sports: sportsData.map(row => row.Sport),
                cardColors: cardColorsData.map(row => row.CardColor).filter(color => color.trim() !== ''),
                cardVariants: cardVariantsData.map(row => row.CardVariant),
                pages: pages,
                currentPage: page,
                totalPages,
                showPrevious: page > 1,
                showNext: page < totalPages,
                showFirst: page > 1,
                showLast: page < totalPages,
                totalItems,
                inventoryItems
            }
        };

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(cacheData)); // Cache for 1 hour

        // Then send the response...
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.json(cacheData.ajaxData);
        } else {
            res.render('inventory', cacheData.pageData);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).send('Server error');
    }
});

async function preWarmCache() {
    // Define common queries or parameters based on dropdown filters
    const commonQueries = [
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Football', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Basketball', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Baseball', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Hockey', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Pokemon (Japan)', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Pokemon (English)', cardColor: '', cardVariant: '' }
    ];

    // Wrap each query in a function that catches and handles its errors
    const prewarmPromises = commonQueries.map(query => {
        return fetchInventoryData(query)
            .then(data => {
                const cacheKey = `inventory:prewarm:${JSON.stringify(query)}`;
                return redisClient.setEx(cacheKey, 3600, JSON.stringify(data))
            })
            .catch(error => {
                console.error(`Error pre-warming cache for query ${JSON.stringify(query)}:`, error);
                return null;
            });
    });

    // Use Promise.all to execute all pre-warm operations in parallel
    try {
        await Promise.all(prewarmPromises);
        console.log('Cache pre-warming complete.');
    } catch (error) {
        // This catch block will now only catch unexpected errors, not individual promise rejections
        console.error('Unexpected error during cache pre-warming:', error);
    }
}

async function fetchInventoryData({ searchTerm, cardSet, cardYear, sport, cardColor, cardVariant }) {
    let whereConditions = [];
    let values = [];

    if (searchTerm) whereConditions.push("CardName = ?"), values.push(searchTerm);
    if (cardSet) whereConditions.push("CardSet = ?"), values.push(cardSet);
    if (cardYear) whereConditions.push("CardYear = ?"), values.push(cardYear);
    if (sport) whereConditions.push("Sport = ?"), values.push(sport);
    if (cardColor) whereConditions.push("CardColor = ?"), values.push(cardColor);
    if (cardVariant) whereConditions.push("CardVariant = ?"), values.push(cardVariant);

    let query = "SELECT * FROM Card";
    if (whereConditions.length) query += " WHERE " + whereConditions.join(" AND ");
    query += " LIMIT 300000";
    try {
        const cards = await db.query(query, values);
        return cards; // Assuming db.query returns the result set
    } catch (error) {
        console.error('Error fetching inventory for pre-warming:', error);
        return [];
    }
}

// Assuming you want to call preWarmCache at application startup
preWarmCache().catch(console.error);

router.get('/cardsets', authenticateToken, async (req, res) => {
    const sport = req.query.sport || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cardVariant = req.query.cardVariant || '';
    const cacheKey = `cardsets:${sport}:${cardColor}:${year}:${cardVariant}`;


    try {
        // Try to fetch the data from cache first
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

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

        // Execute query if not in cache
        const cardSets = await db.query(query, values);
        const cardSetResults = cardSets.map(row => row.CardSet);

        // Cache the result for future requests
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(cardSetResults)); // Cache for 1 hour

        res.json(cardSetResults);
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
    const cacheKey = `years:${sport}:${cardSet}:${cardColor}:${cardVariant}`;

    try {
        // Check if data is in cache
        const cachedYears = await redisClient.get(cacheKey);
        if (cachedYears) {
            return res.json(JSON.parse(cachedYears));
        }

        // Database query if not in cache
        let query = "SELECT DISTINCT CardYear FROM Card";
        let conditions = [];
        let values = [];

        // Building conditions based on query parameters
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

        if (conditions.length) {
            query += " WHERE " + conditions.join(" AND ");
        }
        query += " ORDER BY CardYear DESC";

        const years = await db.query(query, values);

        // Cache the result before sending response
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(years.map(row => row.CardYear))); // Cache for 1 hour

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
    const cacheKey = `sports:${cardSet}:${year}:${cardColor}:${cardVariant}`;

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        let query = "SELECT DISTINCT Sport FROM Card";
        let conditions = [];
        let values = [cardSet, year, cardColor, cardVariant].filter(value => value);

        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");
        if (cardVariant) conditions.push("CardVariant = ?");

        if (conditions.length) query += " WHERE " + conditions.join(" AND ");
        query += " ORDER BY Sport";

        const sports = await db.query(query, values);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(sports.map(row => row.Sport)));

        res.json(sports.map(row => row.Sport));
    } catch (error) {
        console.error(`Error fetching sports:`, error);
        res.status(500).send('Server error');
    }
});


router.get('/cardcolors', authenticateToken, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardVariant = req.query.cardVariant || '';
    const cacheKey = `cardcolors:${sport}:${cardSet}:${year}:${cardVariant}`;


    try {
        // Check if data is in cache
        const cachedCardColors = await redisClient.get(cacheKey);
        if (cachedCardColors) {
            return res.json(JSON.parse(cachedCardColors));
        }

        let query = "SELECT DISTINCT CardColor FROM Card WHERE CardColor IS NOT NULL";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardVariant) conditions.push("CardVariant = ?");

        values = [sport, cardSet, year, cardVariant].filter(value => value !== '');

        if (values.length) {
            query += " AND " + conditions.join(" AND ");
        }

        query += " ORDER BY CardColor";

        const cardColors = await db.query(query, values);

        // Cache the result before sending response
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(cardColors.map(row => row.CardColor)));

        res.json(cardColors.map(row => row.CardColor));
    } catch (error) {
        console.error('Error fetching card colors:', error);
        res.status(500).send('Server error');
    }
});

router.get('/cardvariants', authenticateToken, async (req, res) => {
    const sport = req.query.sport || '';
    const cardSet = req.query.cardSet || '';
    const year = req.query.year || '';
    const cardColor = req.query.cardColor || '';
    const cacheKey = `cardvariants:${sport}:${cardSet}:${year}:${cardColor}`;
 

    try {
        // Check if data is in cache
        const cachedCardVariants = await redisClient.get(cacheKey);
        if (cachedCardVariants) {
            return res.json(JSON.parse(cachedCardVariants));
        }

        let query = "SELECT DISTINCT CardVariant FROM Card";
        let conditions = [];
        let values = [];

        if (sport) conditions.push("Sport = ?");
        if (cardSet) conditions.push("CardSet = ?");
        if (year) conditions.push("CardYear = ?");
        if (cardColor) conditions.push("CardColor = ?");

        values = [sport, cardSet, year, cardColor].filter(value => value !== '');

        if (values.length) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY CardVariant";

        const cardVariants = await db.query(query, values);

        // Cache the result before sending response
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(cardVariants.map(row => row.CardVariant)));

        res.json(cardVariants.map(row => row.CardVariant));
    } catch (error) {
        console.error('Error fetching card variants:', error);
        res.status(500).send('Server error');
    }
});

// Endpoint for full search
router.get('/search-card-sets', authenticateToken, async (req, res) => {
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

router.get('/update-inventory-pricing', authenticateToken, async (req, res) => {
    const cardId = req.query.cardId;
    const sellerId = req.user.id;

    try {
        // Fetch all inventory items for the given CardID and SellerID
        const inventoryQuery = 'SELECT * FROM Inventory WHERE CardID = ? AND SellerID = ?';
        const inventoryItems = await db.query(inventoryQuery, [cardId, sellerId]);

        // Fetch the card details
        const cardDetailsQuery = 'SELECT CardID, CardName, CardSet, CardYear, CardNumber, CardColor, CardVariant, CardImage FROM Card WHERE CardID = ?';
        const cardDetails = await db.query(cardDetailsQuery, [cardId]);

        // Fetch grade options
        const gradeQuery = 'SELECT GradeID, GradeValue FROM Grade WHERE CardID = ? ORDER BY GradeValue DESC';
        const grades = await db.query(gradeQuery, [cardId]);
        console.log(grades); // This should log the grades array to verify its structure



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
        console.log(`Update result: ${result.affectedRows} rows affected.`);
        return result.affectedRows > 0; // Returns true if the row was updated, false otherwise
    } catch (error) {
        console.error('Error updating CardImage:', error);
        throw error; // Rethrow the error to handle it further up the call stack
    }
}

router.post('/submit-inventory', authenticateToken, async (req, res) => {
    const { cardId, listingIds = [], gradeIds = [], salePrices = [], certNumbers = [] } = req.body;
    const sellerId = req.user.id;
    const defaultImageUrl = '/images/defaultPSAImage.png'; 


    try {
        for (let i = 0; i < gradeIds.length; i++) {
            const listingId = listingIds[i];
            const gradeId = gradeIds[i];
            const salePrice = salePrices[i];
            const certNumber = certNumbers[i];

            // Initialize imageURLs to null
            let frontImageUrl = null;
            let backImageUrl = null;

            // If certNumber exists, fetch images
            if (certNumber) {
                const images = await getImagesByCertNumber(certNumber, process.env.PSA_API_KEY, process.env.PSA_ACCESS_TOKEN);
                frontImageUrl = images.frontImageUrl;
                backImageUrl = images.backImageUrl;

                // Update the CardImage in the Card table only if it's the default image
                if (frontImageUrl && frontImageUrl !== defaultImageUrl) {
                    await updateCardImage(cardId, frontImageUrl, defaultImageUrl); // Ensure this function is correctly implemented to only update if default
                }
            }

            // Always update the Inventory item with the new image URLs, regardless of the current value
            if (listingId) {
                // Assuming listingId is an existing entry's identifier, update it
                const updateQuery = 'UPDATE Inventory SET FrontImageUrl = ?, BackImageUrl = ? WHERE ListingID = ? AND CardID = ?';
                await db.query(updateQuery, [frontImageUrl, backImageUrl, listingId, cardId]);
            } else {
                // Insert new inventory item with image URLs
                const insertQuery = 'INSERT INTO Inventory (CardID, GradeID, SalePrice, CertNumber, FrontImageUrl, BackImageUrl, SellerID) VALUES (?, ?, ?, ?, ?, ?, ?)';
                await db.query(insertQuery, [cardId, gradeId, salePrice, certNumber, frontImageUrl, backImageUrl, sellerId]);
            }
        }

        res.redirect('/inventory');
    } catch (err) {
        console.error('Error processing inventory submission:', err);
        res.status(500).send('Error processing inventory');
    }
});

router.get('/quick-list-inventory', authenticateToken, async (req, res) => {
    try {
        // Example: sending user info or configurations
        res.render('quick-list-inventory', {
            userInfo: req.user, // Assuming req.user is available and contains user info
            config: { /* some configuration data if needed */ }
        });
    } catch (error) {
        console.error('Error loading add multiple inventory page:', error);
        res.status(500).send('Server error');
    }
});


router.get('/api/fetch-card-data', authenticateToken, async (req, res) => {
    const { certNumber } = req.query;
    if (!certNumber) {
        return res.status(400).send({ error: 'Cert number is required.' });
    }

    try {
        console.log("Cert number:", req.query.certNumber);
        const cardData = await getCardDataByCertNumber(req.query.certNumber, process.env.PSA_API_KEY, process.env.PSA_ACCESS_TOKEN);
        console.log("Card data:", cardData);        if (cardData) {
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
router.get('/fetch-card-image', authenticateToken, async (req, res) => {
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



router.get('/orders', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    try {
        const query = `
            SELECT Orders.OrderID, Orders.SalePrice, Orders.OrderDate, Users.Username, Shipping.ShipmentStatus
            FROM Orders
            LEFT JOIN Users ON Orders.BuyerID = Users.UserID
            LEFT JOIN Shipping ON Orders.OrderID = Shipping.OrderID
            ORDER BY 
                CASE 
                    WHEN Shipping.ShipmentStatus = 'Awaiting shipment' THEN 1
                    ELSE 2
                END,
                Orders.OrderDate DESC
            LIMIT ? OFFSET ?
        `;
        const orders = await db.query(query, [limit, offset]);

        // Additional query to get the total count of orders
        const countQuery = 'SELECT COUNT(*) AS totalOrders FROM Orders';
        const totalResult = await db.query(countQuery);
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



router.get('/order-details', authenticateToken, async (req, res) => {
    const orderId = req.query.orderId;
    try {
        // Fetch order details
        const orderDetails = await db.query('SELECT * FROM Orders WHERE OrderID = ?', [orderId]);
        const orderItems = await db.query('SELECT * FROM OrderItems WHERE OrderID = ?', [orderId]);
        const feedback = await db.query('SELECT * FROM Feedback WHERE OrderID = ?', [orderId]);
        const shipping = await db.query('SELECT * FROM Shipping WHERE OrderID = ?', [orderId]);
        const addressId = orderDetails[0].AddressID;
        const address = await db.query('SELECT * FROM Addresses WHERE AddressID = ?', [addressId]);

        // Calculate the total price
        const totalPriceResult = await db.query(
            'SELECT SUM(Price * Quantity) AS TotalPrice FROM OrderItems WHERE OrderID = ?',
            [orderId]
        );
        const totalPrice = totalPriceResult[0].TotalPrice;

        // Render the order details page with total price
        res.render('order-details', {
            order: orderDetails[0],
            items: orderItems,
            totalPrice: totalPrice,
            feedback: feedback.length > 0 ? feedback[0] : null,
            shipping: shipping[0],
            address: address[0]
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Error fetching order details');
    }
});

router.get('/messages', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    try {
        const latestMessagesQuery = `
            SELECT 
                c.ConversationID,
                c.Subject,
                lm.LatestMessageID,
                m.SenderID,
                u.Username AS SenderName,
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
            WHERE c.SellerID = ? OR c.BuyerID = ?
            ORDER BY m.Timestamp DESC
            LIMIT ? OFFSET ?`;

        const conversations = await db.query(latestMessagesQuery, [userId, userId, limit, offset]);

        res.render('messages', {
            conversationsWithMessages: conversations,
            page: page,
            limit: limit
        });
    } catch (error) {
        console.error('Error fetching conversations with latest messages:', error);
        res.status(500).send('Server error');
    }
});


router.get('/message-details/:conversationId', authenticateToken, async (req, res) => {
    const conversationId = req.params.conversationId;
    const sellerId = req.user.id; // Corrected typo from req.user,id to req.user.id

    try {
        // Fetch all messages within the specified conversation
        const messagesQuery = `
            SELECT Messages.MessageID, Messages.SenderID, Messages.MessageText, Messages.Timestamp, Users.Username AS SenderName
            FROM Messages
            JOIN Users ON Messages.SenderID = Users.UserID
            WHERE Messages.ConversationID = ?
            ORDER BY Messages.Timestamp ASC`;
    
        let messages = await db.query(messagesQuery, [conversationId]);

        // Mark messages if they are from the seller
        messages = messages.map(message => ({
            ...message,
            isFromSeller: message.SenderID === sellerId,
        }));

        // Optionally, fetch conversation subject for display
        const conversationQuery = `SELECT Subject FROM Conversations WHERE ConversationID = ?`;
        const [conversation] = await db.query(conversationQuery, [conversationId]);

        // Pass the modified messages array to the template
        res.render('message-details', {
            sellerId,
            conversationId,
            conversation,
            messages
        });
    } catch (error) {
        console.error('Error fetching conversation details:', error);
        res.status(500).send('Server error');
    }
});

router.post('/send-message', authenticateToken, async (req, res) => {
    const { conversationId, messageText } = req.body;
    const sellerId = req.user.id; // Assuming this is your seller's ID

    try {
        // Assume BuyerID needs to be fetched based on the conversationId
        const { BuyerID } = await fetchBuyerIdFromConversation(conversationId);

        const insertMessageQuery = `
            INSERT INTO Messages (ConversationID, SenderID, MessageText, Timestamp, ResponseNeeded)
            VALUES (?, ?, ?, NOW(), FALSE)`;
        await db.query(insertMessageQuery, [conversationId, sellerId, messageText]);
    

        // Redirect back to the message-details page or handle as needed
        res.redirect(`/message-details/${conversationId}`);
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



module.exports = router;