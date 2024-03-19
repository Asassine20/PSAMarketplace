const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/middleware');
const articlesController = require('../controllers/articlesController');
const db = require('../db');
const slugify = require('slugify'); 


router.get('/editor', authenticateAdmin, articlesController.editor);

router.post('/publish', authenticateAdmin, async (req, res) => {
    const { title, content } = req.body;
    const slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }); 
    try {
        const result = await db.query("INSERT INTO Articles (Title, Content, Slug, PublishedDate) VALUES (?, ?, ?, NOW())", [title, content, slug]);
        console.log("Article saved", result);
        res.redirect('/articles/editor?success=true');
    } catch (error) {
        console.error('Error saving article:', error);
        res.status(500).send('Error publishing article');
    }
});


router.get('/', async (req, res) => {
    try {
        const articles = await db.query("SELECT * FROM Articles ORDER BY PublishedDate DESC");
        res.render('articles/index', { articles });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).send('Error fetching articles');
    }
});

router.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const articles = await db.query("SELECT * FROM Articles WHERE Slug = ?", [slug]);
        if (articles.length > 0) {
            const article = articles[0];
            res.render('articles/show', { article });
        } else {
            res.status(404).send('Article not found');
        }
    } catch (error) {
        console.error('Error fetching article by slug:', error);
        res.status(500).send('Error fetching article');
    }
});



router.get('/search', async (req, res) => {
    const searchTerm = req.query.query; // Assuming the search term is passed as a query parameter named "query"
    try {
        const articles = await db.query("SELECT * FROM Articles WHERE Title LIKE ? OR Content LIKE ?", [`%${searchTerm}%`, `%${searchTerm}%`]);
        res.render('articles/index', { articles });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).send('Error fetching articles');
    }
});



module.exports = router;
