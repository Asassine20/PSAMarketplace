const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');


// Middleware to check if the user is authenticated and is the admin
function isAuthenticatedAdmin(req, res, next) {
    // Implement your authentication and admin check logic here
    // For simplicity, let's assume all users are admins
    return next();
}

router.get('/editor', isAuthenticatedAdmin, (req, res) => {
    res.render('articles/editor');
});

router.post('/publish', isAuthenticatedAdmin, (req, res) => {
    const { content } = req.body;
    // Save the content to your database or handle it as needed
    console.log(content); // For demonstration purposes
    res.redirect('/articles/editor');
});

module.exports = router;
