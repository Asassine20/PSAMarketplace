const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/middleware.js');
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
    res.render('dashboard');
});


module.exports = router;