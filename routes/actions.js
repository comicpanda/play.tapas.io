const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const router = express.Router();
const DB = require('../db');
const ObjectId = DB.ObjectId;
const R_URL = 'https://rdev.tapas.io/file/move-bucket';
const S3_URL = 'https://s3-us-west-2.amazonaws.com/hero.tapas.io/';
const editable = (series, req) => series.uid === req.uid || (series.emails || '').split(',').indexOf(req.email) > -1;

router.get('/new/series', function(req, res, next) {
  res.render('series-form', { series: {} });
});

router.post('/new/series', function(req, res, next) {
  const uid = req.uid;
  const title = req.body.title;
  const author = req.body.author;
  const password = req.body.password;
  const emails = req.body.emails;
  const series = { title, author, password, uid, emails };
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

  router.get('/edit/series/:slug', (req, res, next) => {
  const slug = req.params.slug;

  DB.q(next, db => {
    db.collection('series').findOne({ slug }, (err, series) => {
      if (err || !series) {
        return next(err);
      }
      if (!editable(series, req)) {
        return res.redirect(`/series/${series.slug}`);
      }
      res.render('series-form', { series });
    });
  });
});

router.post('/edit/series/:slug', (req, res, next) => {
  const title = req.body.title;
  const author = req.body.author;
  const password = req.body.password;
  const emails = req.body.emails;
  const series = { title, author, password, emails };

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

      if (!editable(series, req)) {
        return res.redirect(`/series/${series.slug}`);
      }

      res.render('episode-form', { episode: {}, contents: [], series });
    });
  });
});

router.post('/new/series/:slug/episode', (req, res, next) => {
  const contents = typeof req.body.contents === 'string' ? [req.body.contents] : req.body.contents;
  const srcKeys = typeof req.body.src_keys === 'string' ? [req.body.src_keys] : req.body.src_keys;
  const episode = {
    series_id: req.body.series_id,
    title: req.body.title,
    no: req.body.no,
    filenames: (typeof req.body.src_keys === 'string' ? [req.body.filenames] : req.body.filenames),
    contents: contents.map(content => `${S3_URL}${content}`)
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
        return reject(err);
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

router.post('/edit/series/:slug/episodes/:episodeId', async (req, res, next) => {
  const _id = new ObjectId(req.body._id);
  const contents = typeof req.body.contents === 'string' ? [req.body.contents] : req.body.contents;
  const srcKeys = typeof req.body.src_keys === 'string' ? [req.body.src_keys] : req.body.src_keys;
  const episode = {
    series_id: req.body.series_id,
    title: req.body.title,
    no: req.body.no,
    filenames: (typeof req.body.src_keys === 'string' ? [req.body.filenames] : req.body.filenames),
    contents: contents.map(content => {
      if (!content.startsWith('https')) {
        return `${S3_URL}${content}`;
      }
      return content;
    })
  };
  const currentEpisode = await DB.asyncQ((db, resolve, reject) => {
    db.collection('episode').findOne({ _id }, (err, episode) => {
      if (err || !episode) {
        return reject(err);
      }
      resolve(episode);
    });
  }).catch(err => next(err));
  let deletedFiles = [];
  currentEpisode.contents.forEach(content => {
    if (!contents.includes(content))  {
      deletedFiles.push({filename: content.replace(S3_URL, '')});
    }
  });
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
      db.collection('episode').findOneAndUpdate({ _id }, { $set: episode }, async (err, result) => {
        if (err) {
          return next(err);
        }
        if (deletedFiles.length > 0) {
          await DB.asyncQ((db, resolve, reject) => {
            db.collection('deleted_files').insertMany(deletedFiles, (err) => {
              if (err) {
                return reject(err);
              }
              resolve();
            })
          });
        }
        res.redirect(`/series/${req.params.slug}/episodes/${episode.no}`);
      });
    });
  }).catch(err => {
    next(err);
  });
});

module.exports = router;
