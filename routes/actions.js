const express = require('express');
const router = express.Router();
const DB = require('../db');

router.get('/new/series', function(req, res, next) {
  const aSeries = { title: '', author: '' };
  res.render('series-form', { aSeries });
});

router.post('/new/series', function(req, res, next) {
  const title = req.body.title;
  const author = req.body.author;
  const aSeries = { title, author };
  if (!title.trim() || !author.trim()) {
    return res.render('series-form', { mode: 'err', aSeries });
  }

  //https://gist.github.com/mathewbyrne/1280286 : slugify.js
  aSeries.slug = title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    + '-'
    + Math.random().toString(36).substring(7);

  DB.q((dbErr, db) => {
    if (dbErr) {
      return next(dbErr);
    }
    db.collection('series').insertOne(aSeries, (err, result) => {
      if (err) {
        return next(err);
      }
      res.redirect(`/series/${aSeries.slug}`);
    });
  });
});

router.get('/edit/series/:slug', function(req, res, next) {
  const slug = req.params.slug;

  DB.q((dbErr, db) => {
    if (dbErr) {
      return next(dbErr);
    }
    db.collection('series').find({ slug }).toArray(function(err, series) {
      if (err) {
        return next(err);
      }
      const aSeries = series[0];
      if (!aSeries) {
        next(null);
      }
      res.render('series-form', { mode: 'edit', aSeries });
    });
  });
});


router.get('/new/series/:id/episode', function(req, res, next) {
  res.render('episode-form');
});

module.exports = router;
