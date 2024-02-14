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
    const cacheKey = `inventory:${sellerId}:${page}:${limit}:${searchTerm}:${cardSet}:${cardYear}:${sport}:${cardColor}:${cardVariant}`;

    try {
        let whereConditions = [];
        let values = [];

        if (searchTerm) {
            whereConditions.push("CardName = ?");
            values.push(searchTerm.trim());
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

        // Build the main query
        let query = "SELECT * FROM Card";
        if (whereConditions.length) {
            query += " WHERE " + whereConditions.join(" AND ");
        }
        // Add ORDER BY clause to sort by CardSet alphabetically
        query += " ORDER BY CardSet ASC";
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
                showPrevious: showPrevious,
                showNext: showNext,
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
                currentPage: page,
                totalPages,
                showPrevious,
                showNext,
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
        { searchTerm: '', cardSet: '', cardYear: '', sport: '', cardColor: '', cardVariant: '' }, // General query example
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Football', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Basketball', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Baseball', cardColor: '', cardVariant: '' },
        { searchTerm: '', cardSet: '', cardYear: '', sport: 'Hockey', cardColor: '', cardVariant: '' }
    ];

    for (const query of commonQueries) {
        const cacheKey = `inventory:prewarm:${JSON.stringify(query)}`;
        const data = await fetchInventoryData(query);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
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
    query += " LIMIT 100"; // Adjust limit based on your needs for pre-warming

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
// Endpoint for full search with Redis caching
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
        // Fetch inventory items for the given CardID and SellerID
        const inventoryQuery = 'SELECT * FROM Inventory WHERE CardID = ? AND SellerID = ?';
        const inventoryItems = await db.query(inventoryQuery, [cardId, sellerId]);
        
        // Assuming you might have multiple inventory items for a card, you'll need to handle how you select/display these
        let inventoryData = inventoryItems.length > 0 ? inventoryItems[0] : {};
        
        // Now, if there's inventory data, proceed to fetch the card details
        const cardDetailsQuery = 'SELECT CardID, CardName, CardSet, CardYear, CardNumber, CardColor, CardVariant, CardImage FROM Card WHERE CardID = ?';
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
            cardDetails: cardDetails.length > 0 ? {...cardDetails[0]} : {}, // Updated to include card details without scraped image
            grades: gradesWithIds,
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Server error');
    }
});

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

async function updateCardImage(cardId, newImageUrl) {
    // This query updates the CardImage only if it's currently the default image
    const query = `
        UPDATE Card
        SET CardImage = ?
        WHERE CardID = ?
        AND CardImage = '/images/defaultPSAImage.png'
    `;
    const values = [newImageUrl, cardId];

    try {
        const result = await db.query(query, values);
        return result.affectedRows > 0; // Returns true if the image was updated, false otherwise
    } catch (error) {
        console.error('Error updating CardImage:', error);
        throw error;
    }
}

router.post('/submit-inventory', authenticateToken, async (req, res) => {
    const { cardId, listingId, gradeIds = [], salePrices = [], certNumbers = [] } = req.body;
    const sellerId = req.user.id;
    const defaultImageUrl = '/images/defaultPSAImage.png'; // The default image URL set in the database

    try {
        // Iterate over each row submitted
        for (let index = 0; index < gradeIds.length; index++) {
            const gradeId = gradeIds[index];
            const salePrice = salePrices[index];
            const certNumber = certNumbers[index];

            // Initialize imageURLs to null
            let frontImageUrl = null;
            let backImageUrl = null;

            // If certNumber exists, fetch images
            if (certNumber) {
                const images = await getImagesByCertNumber(certNumber, process.env.PSA_API_KEY, process.env.PSA_ACCESS_TOKEN);
                frontImageUrl = images.frontImageUrl;
                backImageUrl = images.backImageUrl;
            
                // Update the CardImage only if it's the default image
                if (frontImageUrl && frontImageUrl !== defaultImageUrl) {
                    await updateCardImage(cardId, frontImageUrl); // updated function call
                }
            }

            // Insert or update logic here, incorporating certNumber and image URLs handling
            let query, queryParams;
            if (listingId) {
                // Update logic, if applicable. Adjust as needed.
            } else {
                // Insert new inventory item with image URLs
                query = 'INSERT INTO Inventory (CardID, GradeID, SalePrice, CertNumber, FrontImageUrl, BackImageUrl, SellerID) VALUES (?, ?, ?, ?, ?, ?, ?)';
                queryParams = [cardId, gradeId, salePrice, certNumber, frontImageUrl, backImageUrl, sellerId];
                await db.query(query, queryParams);
            }
        }

        res.redirect('/inventory');
    } catch (err) {
        console.error('Error processing inventory:', err);
        res.status(500).send('Error processing inventory');
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