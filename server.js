const express = require('express');
const compression = require('compression');
const path = require('path');
const server = express();
const db = require('./db');
const port = 3001;
const publicDirectory = path.join(__dirname, './public')
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');
const articlesRoutes = require('./routes/articles');
const homePageRoutes = require('./routes/homepage');
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
server.use(homePageRoutes);
//Define routes
server.use('/', require('./routes/pages'));
server.use('/articles', articlesRoutes);

server.use('/auth', require('./routes/auth'));

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

hbs.registerHelper('formatDateNoTime', function(date) {
    const options = { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric',
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
    // Attempt to convert the incoming value to a float
    const num = parseFloat(value);
    // Check if the conversion was successful (i.e., the result is not NaN)
    if (!isNaN(num)) {
        // If successful, format the number and return it
        return num.toFixed(2);
    }
    // If conversion wasn't successful, return a default value or message
    // This could be a message or simply the original value, depending on your preference
    return "N/A"; // Or any appropriate fallback value
});


hbs.registerHelper('slice', function(content, options) {
    const limit = options.hash.limit;
    return content.length > limit ? content.substring(0, limit) + "..." : content;
});

hbs.registerPartials('/Users/andrewsassine/PSAMarketplace/views');
hbs.registerPartials('/Users/andrewsassine/PSAMarketplace/views/articles');

