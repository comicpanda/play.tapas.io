const express = require('express');
const router = express.Router();
const DB = require('../db');
const ObjectId = DB.ObjectId;

router.get('/:slug', function(req, res, next) {
  const slug = req.params.slug;
  DB.q(next, db => {
    db.collection('series').findOne({slug}, (err, series) => {
      if (err) {
        return next(err);
      }
      db.collection('episode').find({series_id: `${series._id}`}).toArray((err, episodes) => {
        if (err) {
          return next(err);
        }
        res.render('series', { episodes, series });
      });
    });
  });
});

router.get('/:slug/episodes/:no', function(req, res, next) {
  const slug = req.params.slug;
  DB.q(next, db => {
    db.collection('series').findOne({slug}, (err, series) => {
      if (err) {
        return next(err);
      }
      db.collection('episode').findOne({series_id: `${series._id}`, no: req.params.no}, (err, episode) => {
        if (err) {
          return next(err);
        }
        res.render('episode', { episode });
      });
    });
  });
});

module.exports = router;
