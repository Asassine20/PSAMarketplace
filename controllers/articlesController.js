const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.editor = (req, res) => {
    res.render('articles/editor');
};
