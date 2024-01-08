const express = require('express');
const path = require('path');
const server = express();
const db = require('./db');
const port = 3001;
const publicDirectory = path.join(__dirname, './public')
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');
const inventoryRoutes = require('./routes/pages');
const hbs = require('hbs');

server.use(cookieParser());

server.use(express.static(publicDirectory));

server.set('view engine', 'hbs');

// Parse URL-encoded bodies (as sent by HTML Forms)
server.use(express.urlencoded({ extended: false }));

// Parse JSON bodies (as sent by API clients)
server.use(express.json());

//Define routes
server.use('/', require('./routes/pages'));
server.use('/auth', require('./routes/auth'));

server.use('/', inventoryRoutes);

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

hbs.registerHelper('plus', function(value, increment) {
    return value + increment;
});

hbs.registerHelper('minus', function(value, decrement) {
    return value - decrement;
});

hbs.registerHelper('eq', function(arg1, arg2, options) {
    return arg1 === arg2;
});