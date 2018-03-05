const express = require('express');
const DB = require('../db');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('auth');
});

router.post('/', (req, res, next) => {
  res.cookie('uid', req.body.uid, { maxAge: 14 * 24 * 60 * 60 * 1000, httpOnly: true });
  res.redirect('/');
});

module.exports = router;
