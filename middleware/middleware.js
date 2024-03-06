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
        res.locals.ordersCount = 1;
        res.locals.messagesCount = 1;
        return next();
    }

    try {
        const ordersQuery = `
            SELECT COUNT(*) AS count
            FROM Shipping
            INNER JOIN Orders ON Shipping.OrderNumber = Orders.OrderNumber
            WHERE Orders.SellerID = ? AND Shipping.ShippedWithTracking = 0
        `;
        // Await for the query to execute and directly destructure the first element of the result array
        const [orders] = await db.query(ordersQuery, [req.user.id]);
        // Assuming the first element of the array is the RowDataPacket object you're interested in
        res.locals.ordersCount = orders[0]?.count || 0; // Use optional chaining and nullish coalescing to default to 0

        const messagesQuery = `
            SELECT COUNT(*) AS count
            FROM Messages
            INNER JOIN Conversations ON Messages.ConversationID = Conversations.ConversationID
            WHERE Conversations.SellerID = ? AND Messages.IsRead = 0
        `;
        // Await for the query to execute and directly destructure the first element of the result array
        const [messages] = await db.query(messagesQuery, [req.user.id]);
        // Assuming the first element of the array is the RowDataPacket object you're interested in
        res.locals.messagesCount = messages[0]?.count || 0; // Use optional chaining and nullish coalescing to default to 0

        next();
    } catch (err) {
        console.error('Error fetching notification counts:', err);
        next(err); // Ensure the next middleware or route handler can run even in case of an error
    }
};


