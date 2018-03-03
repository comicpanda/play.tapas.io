const express = require('express');
const DB = require('../db');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('auth');
});

router.post('/', (req, res, next) => {
  res.cookie('idToken', req.body.idToken, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  res.redirect('/');
});

module.exports = router;
