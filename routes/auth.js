const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index')
});

router.post('/register', authController.register )

router.post('/login', authController.login );

router.post('/seller-info', authController.submitSellerInfo);

router.get('/final-verification', (req, res) => {
    res.render('final-verification');
});

router.get('/confirm-email', async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        connection.query('UPDATE Users SET emailConfirmed = TRUE WHERE id = ?', [userId], (error, results) => {
            if (error) {
                throw error;
            }
            if (results.affectedRows === 0) {
                // No user found with this ID or no update needed
                return res.status(404).send("User not found or already confirmed.");
            } else {
                // Email confirmed successfully
                res.send("Email successfully confirmed.");
            }
        });
    } catch (error) {
        console.error('Confirmation error:', error);
        res.status(400).send("Invalid or expired link.");
    }
});

module.exports = router;