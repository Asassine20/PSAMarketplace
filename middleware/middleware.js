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
        console.log("Orders Results:", ordersResults); // Debugging
        const ordersCount = ordersResults[0]?.count || 0;
        res.locals.ordersCount = ordersCount;

        const messagesQuery = `
            SELECT COUNT(*) AS count
            FROM Messages
            INNER JOIN Conversations ON Messages.ConversationID = Conversations.ConversationID
            WHERE Conversations.SellerID = ? AND Messages.IsRead = 0
        `;
        const messagesResults = await db.query(messagesQuery, [req.user.id]);
        console.log("Messages Results:", messagesResults); // Debugging
        const messagesCount = messagesResults[0]?.count || 0;
        res.locals.messagesCount = messagesCount;

        next();
    } catch (err) {
        console.error('Error fetching notification counts:', err);
        next(err);
    }
};



