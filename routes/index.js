const express = require('express');
const DB = require('../db');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  DB.q((dbErr, db) => {
    if (dbErr) {
      return next(dbErr);
    }
    db.collection('series').find().toArray(function(err, series) {
      if (err) {
        return next(err);
      }
      series = [
        {id: 1, title: 'Hello World', author: 'Yoon', slug: 'hello-world'},
        {id: 2, title: 'Hello World2', author: 'Yoon1', slug: 'hello-world2'},
        {id: 3, title: 'Hello World4', author: 'Yoon2', slug: 'hello-world4'},
      ];
      res.render('index', { series });
    });
  });
});

module.exports = router;
