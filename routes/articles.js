const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/middleware');
const articlesController = require('../controllers/articlesController');
const db = require('../db');

router.get('/editor', authenticateAdmin, articlesController.editor);

router.post('/publish', authenticateAdmin, async (req, res) => {
    const { title, content } = req.body;
    try {
        const result = await db.query("INSERT INTO Articles (Title, Content, PublishedDate) VALUES (?, ?, NOW())", [title, content]);
        console.log("Article saved", result);
        res.redirect('/articles/editor?success=true'); // Redirect back with a success message/query
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



router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [articles] = await db.query("SELECT * FROM Articles WHERE ArticleID = ?", [id]);
        if(articles.length > 0){
            const article = articles[0];
            res.render('articles/show', { article });
        } else {
            res.status(404).send('Article not found');
        }
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).send('Error fetching article');
    }
});


module.exports = router;
