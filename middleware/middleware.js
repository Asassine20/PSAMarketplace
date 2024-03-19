const jwt = require('jsonwebtoken');
const db = require('../db'); // Ensure this points to your database connection module

exports.authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.user = decoded;
        next();
    });
};

exports.authenticateAdmin = async (req, res, next) => {
    const token = req.cookies.jwt; // Assuming the token is stored in cookies
    if (!token) {
        return res.status(401).send('Access Denied: No Token Provided!');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Ensure your query method supports Promises or use callbacks appropriately
        const [user] = await db.query('SELECT * FROM Users WHERE UserID = ?', [decoded.id]);
        if (user && user.IsAdmin) {
            req.user = user; // Add user details to the request
            next();
        } else {
            return res.status(403).send('Access Denied: You do not have admin rights.');
        }
    } catch (error) {
        res.status(400).send('Invalid Token');
    }
};


exports.notificationCounts = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        res.locals.ordersCount = 0;
        res.locals.messagesCount = 0;
        return next();
    }

    try {
        const ordersQuery = `
            SELECT COUNT(*) AS count
            FROM Shipping
            INNER JOIN Orders ON Shipping.OrderNumber = Orders.OrderNumber
            WHERE Orders.SellerID = ? AND Shipping.ShippedWithTracking = 0
        `;
        const ordersResults = await db.query(ordersQuery, [req.user.id]);
        const ordersCount = ordersResults[0]?.count || 0;
        res.locals.ordersCount = ordersCount;

        const messagesQuery = `
            SELECT COUNT(*) AS count
            FROM Messages
            INNER JOIN Conversations ON Messages.ConversationID = Conversations.ConversationID
            WHERE Conversations.SellerID = ? AND Messages.IsRead = 0
        `;
        const messagesResults = await db.query(messagesQuery, [req.user.id]);
        const messagesCount = messagesResults[0]?.count || 0;
        res.locals.messagesCount = messagesCount;

        next();
    } catch (err) {
        console.error('Error fetching notification counts:', err);
        next(err);
    }
};



