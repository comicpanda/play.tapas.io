const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
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
      if (err || !series) {
        return next(err);
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
router.get('/new/series/:slug/episode', (req, res, next) => {
  DB.q(next, db => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        next(err);
      }
      res.render('episode-form', { episode: {}, contents: [], series });
    });
  });
});

router.post('/new/series/:slug/episode', async (req, res, next) => {
  const contents = typeof req.body.contents === 'string' ? [req.body.contents] : req.body.contents;
  const srcKeys = typeof req.body.src_keys === 'string' ? [req.body.src_keys] : req.body.src_keys;
  const episode = {
    series_id: req.body.series_id,
    title: req.body.title,
    no: req.body.no,
    filenames: (typeof req.body.src_keys === 'string' ? [req.body.filenames] : req.body.filenames),
    contents: contents.map(content => `https://s3-us-west-2.amazonaws.com/hero.tapas.io/${content}`)
  };
  let requests = [];
  contents.forEach((content, idx) => {
    requests.push(axios.post(R_URL, querystring.stringify({
      src_bucket: 'r.tapas.io',
      desc_bucket: 'hero.tapas.io',
      src_key: srcKeys[idx],
      desc_key: content
    }),{
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }));
  });
  axios.all(requests).then(() => {
    DB.q(next, db => {
      db.collection('episode').insertOne(episode, (err, result) => {
        if (err) {
          return next(err);
        }
        res.redirect(`/series/${req.params.slug}/episodes/${episode.no}`);
      });
    });
  }).catch(err => {
    next(err);
  });
});

router.get('/edit/series/:slug/episodes/:episodeId', async (req, res, next) => {
  const series = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  DB.q(next, db => {
    db.collection('episode').findOne({_id: new ObjectId(req.params.episodeId)}, (err, episode) => {
      if (err || !episode) {
        return next(err);
      }
      let contents = [];
      episode.contents.forEach((content, idx) => {
        contents.push({
          s3: {
            url: content,
            desc_keys: ['', content],
            src_keys: ['', '']
          },
          filename: episode.filenames[idx],
        });
      });

      res.render('episode-form', { episode, contents, series });
    });
  });
});

router.post('/edit/series/:slug/episodes/:episodeId', (req, res, next) => {
  const contents = typeof req.body.contents === 'string' ? [req.body.contents] : req.body.contents;
  const srcKeys = typeof req.body.src_keys === 'string' ? [req.body.src_keys] : req.body.src_keys;
  const episode = {
    series_id: req.body.series_id,
    title: req.body.title,
    no: req.body.no,
    filenames: (typeof req.body.src_keys === 'string' ? [req.body.filenames] : req.body.filenames),
    contents: contents.map(content => {
      if (!content.startsWith('https')) {
        return `https://s3-us-west-2.amazonaws.com/hero.tapas.io/${content}`;
      }
      return content;
    })
  };
  let requests = [];
  // TODO duplicated
  contents.forEach((content, idx) => {
    if (!content.startsWith('https')) {
      requests.push(axios.post(R_URL, querystring.stringify({
        src_bucket: 'r.tapas.io',
        desc_bucket: 'hero.tapas.io',
        src_key: srcKeys[idx],
        desc_key: content
      }),{
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }));
    }
  });

  axios.all(requests).then(() => {
    DB.q(next, db => {
      const _id = new ObjectId(req.body._id);
      db.collection('episode').findOneAndUpdate({ _id }, { $set: episode }, (err, result) => {
        if (err) {
          return next(err);
        }
        res.redirect(`/series/${req.params.slug}/episodes/${episode.no}`);
      });
    });
  }).catch(err => {
    next(err);
  });
});

module.exports = router;
