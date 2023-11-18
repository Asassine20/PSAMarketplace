const express = require('express');
const path = require('path');
const server = express();
const db = require('./db');
const port = 3001;
const publicDirectory = path.join(__dirname, './public')
server.use(express.static(publicDirectory));

server.set('view engine', 'hbs');

server.get('/', (req, res) => {
    res.render("index");
});

server.get('/register', (req, res) => {
    res.render("register");
});


server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});