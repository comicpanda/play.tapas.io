const express = require('express');
const axios = require('axios');
const router = express.Router();
const DB = require('../db');
const ObjectId = DB.ObjectId;
const R_URL = 'https://rdev.tapas.io/file/move-bucket';
router.get('/new/series', function(req, res, next) {
  res.render('series-form', { series: {} });
});

router.post('/new/series', function(req, res, next) {
  const title = req.body.title;
  const author = req.body.author;
  const series = { title, author };
  if (!title.trim() || !author.trim()) {
    return res.render('series-form', { mode: 'err', series });
  }

  //https://gist.github.com/mathewbyrne/1280286 : slugify.js
  series.slug = title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    + '-'
    + Math.random().toString(36).substring(7);

  DB.q(next, db => {
    db.collection('series').insertOne(series, (err, result) => {
      if (err) {
        return next(err);
      }
      res.redirect(`/series/${series.slug}`);
    });
  });
});

router.get('/edit/series/:slug', function(req, res, next) {
  const slug = req.params.slug;

  DB.q(next, db => {
    db.collection('series').findOne({ slug }, (err, series) => {
      if (err) {
        return next(err);
      }
      if (!series) {
        next(null);
      }
      res.render('series-form', { series });
    });
  });
});

router.post('/edit/series/:slug', function(req, res, next) {
  const title = req.body.title;
  const author = req.body.author;
  const series = { title, author };

  if (!title.trim() || !author.trim()) {
    return res.render('series-form', { mode: 'err', series });
  }

  DB.q(next, db => {
    db.collection('series').findOneAndUpdate({ _id: new ObjectId(req.body._id) }, { $set: series }, (err, result) => {
      if (err) {
        return next(err);
      }
      res.redirect(`/series/${req.params.slug}`);
    });
  });
});

// --------- Episode
router.get('/new/series/:id/:slug/episode', function(req, res, next) {
  const episode = { series_id: req.params.id };
  res.render('episode-form', { episode });
});

router.post('/new/series/:id/:slug/episode', function(req, res, next) {
  const episode = {
    series_id: req.params.id,
    title: req.body.title,
    no: req.body.no,
    contents: req.body.contents
  };
  let requests = [];
  episode.contents.forEach((content, idx) => {
    requests.push(axios.post(R_URL, {
      src_bucket: 'r.tapas.io',
      desc_bucket: 'hero.tapas.io',
      src_key: req.body.src_keys[idx],
      desc_key: content
    }));
  });
  axios.all(requests).then(() => {
    DB.q(next, db => {
      db.collection('episode').insertOne(episode, (err, result) => {
        if (err) {
          return next(err);
        }
        res.redirect(`/series/${req.params.slug}/ep/${episode.no}`);
      });
    });
  }).catch(err => {
    next(err);
  });
});

module.exports = router;
