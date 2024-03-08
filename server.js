const express = require('express');
const compression = require('compression');
const path = require('path');
const server = express();
const db = require('./db');
const port = 3000;
const publicDirectory = path.join(__dirname, './public')
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');
const inventoryRoutes = require('./routes/pages');
const hbs = require('hbs');

server.use(cookieParser());

server.use(compression());

server.use(express.static(publicDirectory));
server.use(express.static('public'));

server.set('view engine', 'hbs');

// Parse URL-encoded bodies (as sent by HTML Forms)
server.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
server.use(express.json());
server.use(authRoutes);

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

hbs.registerHelper('formatDate', function(date) {
    const options = { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('en-US', options);
  });
  
hbs.registerHelper('displayShippingMethod', function(shippedWithTracking) {
    return shippedWithTracking ? "Shipped with tracking" : "Shipped without tracking";
});

hbs.registerHelper('statusColor', function(status) {
    if (status === 'Delivered') {
        return 'status-green';
    } else if (status === 'In Transit') {
        return 'status-yellow';
    } else {
        return '';
    }
});

hbs.registerHelper('gt', function(value1, value2) {
    return value1 > value2;
});

hbs.registerHelper('lt', function(value1, value2) {
    return value1 < value2;
});

hbs.registerHelper('surroundingPages', function(currentPage, options) {
    const totalPages = options.hash.totalPages;
    let startPage = Math.max(currentPage - 2, 1);
    let endPage = Math.min(currentPage + 2, totalPages);

    // Adjust the start and end page if near the beginning or end
    if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    if (currentPage > totalPages - 3) {
        startPage = Math.max(totalPages - 4, 1);
    }

    let pages = [];
    for (let page = startPage; page <= endPage; page++) {
        pages.push(page);
    }
    return pages;
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

hbs.registerHelper('formatCurrency', function(value) {
    return value.toFixed(2);
});

hbs.registerPartials('/Users/andrewsassine/PSAMarketplace/views');
