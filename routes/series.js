const express = require('express');
const router = express.Router();
const DB = require('../db');
const ObjectId = DB.ObjectId;

const session = {};
const editable = (series, req) => series.uid === req.uid || (series.emails || '').split(',').indexOf(req.email) > -1;

router.get('/:slug', (req, res, next) => {
  const slug = req.params.slug;
  DB.q(next, db => {
    db.collection('series').findOne({slug}, (err, series) => {
      if (err || !series) {
        return next(err);
      }

      db.collection('episode').find({series_id: `${series._id}`}).sort({no: 1}).toArray((err, episodes) => {
        if (err) {
          return next(err);
        }
        res.render('series', { episodes, series, editable: editable(series, req) });
      });
    });
  });
});

router.get('/:slug/password/episodes/:no', (req, res, next) => {
  const slug = req.params.slug;
  const no = req.params.no;
  DB.q(next, db => {
    db.collection('series').findOne({slug}, (err, series) => {
      if (err || !series) {
        return next(err);
      }
      res.render('password-form', { series, no });
    });
  });
});

router.post('/:slug/password/episodes/:no', (req, res, next) => {
  const slug = req.params.slug;
  DB.q(next, db => {
    db.collection('series').findOne({slug}, (err, series) => {
      if (err || !series) {
        return next(err);
      }
      if (series.password !== req.body.password) {
        return res.redirect(`/series/${slug}`);
      }
      session[`${res.uid}.${slug}`] = true;
      setTimeout(() => {
        delete session[`${res.uid}.${slug}`];
      }, 24 * 60 * 60 * 1000)
      res.redirect(`/series/${slug}/episodes/${req.params.no}`);
    });
  });
});

router.get('/:slug/episodes/:no', async (req, res, next) => {
  const slug = req.params.slug;
  const no = parseInt(req.params.no, 10);
  if (isNaN(no)) {
    return next();
  }
  const series = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => next(err));

  if (!req.email.endsWith('tapasmedia.co') && !editable(series, req) && !session[`${res.uid}.${slug}`]) {
    return res.redirect(`/series/${slug}/password/episodes/${no}`);
  }

  const series_id = `${series._id}`;
  const prevEpisode = await DB.asyncQ((db, resolve, reject) => {
    db.collection('episode').find({series_id, no: { $lt: no}}).sort({no: -1}).limit(1).toArray((err, episodes) => {
      if (err) {
        return reject(err);
      }
      resolve(episodes[0]);
    });
  });

  const nextEpisode = await DB.asyncQ((db, resolve, reject) => {
    db.collection('episode').find({series_id, no: { $gt: no}}).sort({no: 1}).limit(1).toArray((err, episodes) => {
      if (err) {
        return reject(err);
      }
      resolve(episodes[0]);
    });
  });
  const episodeNavMap = {
    hasPrev: !!prevEpisode,
    hasNext: !!nextEpisode,
    prevNo: (prevEpisode || {}).no,
    nextNo: (nextEpisode || {}).no
  };

  DB.q(next, db => {
    db.collection('episode').findOne({ series_id, no }, (err, episode) => {
      if (err || !episode) {
        return next(err);
      }
      res.render('episode', { episode, series, episodeNavMap });
    });
  });
});

module.exports = router;
