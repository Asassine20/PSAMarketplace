const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index')
});

router.post('/register', authController.register )

router.post('/login', authController.login );

router.post('/seller-info', authController.submitSellerInfo);

module.exports = router;