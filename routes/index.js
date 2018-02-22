const express = require('express');
const DB = require('../db');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  DB.q(next, db => {
    db.collection('series').find().toArray(function(err, series) {
      if (err) {
        return next(err);
      }
      res.render('index', { series });
    });
  });
});

module.exports = router;
