const express = require('express');
const server = express();
const db = require('./db');
const port = 3001;

server.get('/', (req, res) => {
    res.send('Hello');
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});