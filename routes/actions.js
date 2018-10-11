const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const router = express.Router();
const DB = require('../db');
const ObjectId = DB.ObjectId;
const R_URL = 'https://rdev.tapas.io/file/move-bucket';
const S3_URL = 'https://s3-us-west-2.amazonaws.com/hero.tapas.io/';
const nodeMailer = require('nodemailer');
const editable = (series, req) =>
  series.uid === req.uid ||
  (series.emails || '').split(',').includes(req.email) ||
  req.email === 'isyoon@tapasmedia.co';

const smtpConfig = {
  host: 'smtp.sendgrid.net',
  port: 465,
  secure: true,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
};

router.get('/new/series', (req, res, next) => {
    res.render('series-form', { series: {} });
});

router.post('/new/series', (req, res, next) => {
  const uid = req.uid;
  const title = req.body.title;
  const author = req.body.author;
  const password = req.body.password;
  const emails = (req.body.emails || '').trim();
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

router.post('/edit/series/:slug', async (req, res, next) => {
  const title = req.body.title;
  const author = req.body.author;
  const password = req.body.password;
  const emails = (req.body.emails || '').trim();
  const series = { title, author, password, emails };

  if (!title.trim() || !author.trim()) {
    return res.render('series-form', { mode: 'err', series });
  }

  const currentSeries = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  if (!editable(currentSeries, req)) {
    return res.redirect(`/series/${currentSeries.slug}`);
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

router.delete('/edit/series/:slug', async (req, res, next) => {
  const series = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  if (!editable(series, req)) {
    return res.redirect(`/series/${series.slug}`);
  }

  const episodes = await DB.asyncQ((db, resolve, reject) => {
    db.collection('episode').find({series_id: `${series._id}`}).toArray((err, episodes) => {
      if (err) {
        return resject(err);
      }
      resolve(episodes);
    });
  }).catch(err => { next(err) });

  const deletedFiles = episodes.map(episode => episode.contents)
    .reduce((a, value) => a.concat(value), [])
    .map(content => ({ filename: content.replace(S3_URL, '')}));

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

  await DB.asyncQ((db, resolve, reject) => {
    db.collection('episode').deleteMany({series_id: `${series._id}`}, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  });

  DB.q(next, db => {
    db.collection('series').deleteOne({ _id: series._id }, (err, result) => {
      res.redirect('/');
    });
  });
});

router.post('/sub/series/:slug', async (req, res, next) => {
  const currentSeries = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  let subscribers = currentSeries.subscribers || '';
  if (subscribers.split(',').includes(req.email)) {
    return res.redirect(`/series/${series.slug}`);
  }

  currentSeries.subscribers = `${subscribers}${subscribers === '' ? '' : ','}${req.email}`;

  DB.q(next, db => {
    db.collection('series').findOneAndUpdate({ _id: new ObjectId(req.body._id) }, { $set: currentSeries }, (err, result) => {
      if (err) {
        return next(err);
      }
      res.redirect(`/series/${req.params.slug}`);
    });
  });
});

router.delete('/sub/series/:slug', async (req, res, next) => {
  const currentSeries = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  let subscribers = currentSeries.subscribers || '';
  if (!subscribers.split(',').includes(req.email)) {
    return res.redirect(`/series/${series.slug}`);
  }

  currentSeries.subscribers = subscribers.split(',').filter(sub => sub !== req.email).join(',');

  DB.q(next, db => {
    db.collection('series').findOneAndUpdate({ _id: new ObjectId(req.body._id) }, { $set: currentSeries }, (err, result) => {
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

router.post('/new/series/:slug/episode', async (req, res, next) => {
  const contents = typeof req.body.contents === 'string' ? [req.body.contents] : req.body.contents;
  const srcKeys = typeof req.body.src_keys === 'string' ? [req.body.src_keys] : req.body.src_keys;
  const episode = {
    series_id: req.body.series_id,
    title: req.body.title,
    no: parseInt(req.body.no, 10),
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

  const currentSeries = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  axios.all(requests).then(() => {
    DB.q(next, db => {
      db.collection('episode').insertOne(episode, (err, result) => {
        if (err) {
          return next(err);
        }
        if ((currentSeries.subscribers || '')) {
          try {
            const transporter = nodeMailer.createTransport(smtpConfig);
            transporter.sendMail({
              from: ['Tapas <no-reply@tapas.io>'],
              to: currentSeries.subscribers,
              subject: `A new episode of ${currentSeries.title} is uploaded`,
              html: `<p>A new episode is up.</p>
                <p>Series title : ${currentSeries.title}</p>
                <p>Episode no : ${episode.no}</p>
                <p>Episode title : ${episode.title}</p>
                <p><a href="http://play.tapas.io/series/${currentSeries.slug}/episodes/${episode.no}">Here is a link.</a></p>`
            });
          } catch (err) {
            console.err(err);
          }
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

  if (!editable(series, req)) {
    return res.redirect(`/series/${series.slug}`);
  }

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
  const series = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  if (!editable(series, req)) {
    return res.redirect(`/series/${series.slug}`);
  }

  const _id = new ObjectId(req.body._id);
  const contents = typeof req.body.contents === 'string' ? [req.body.contents] : req.body.contents;
  const srcKeys = typeof req.body.src_keys === 'string' ? [req.body.src_keys] : req.body.src_keys;
  const episode = {
    series_id: req.body.series_id,
    title: req.body.title,
    no: parseInt(req.body.no, 10),
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
        res.redirect(`/series/${series.slug}/episodes/${episode.no}`);
      });
    });
  }).catch(err => {
    next(err);
  });
});

router.delete('/edit/series/:slug/episodes/:episodeId', async (req, res, next) => {
  const series = await DB.asyncQ((db, resolve, reject) => {
    db.collection('series').findOne({ slug: req.params.slug }, (err, series) => {
      if (err || !series) {
        return reject(err);
      }
      resolve(series);
    });
  }).catch(err => { next(err) });

  if (!editable(series, req)) {
    return res.redirect(`/series/${series.slug}`);
  }

  const _id = new ObjectId(req.params.episodeId);
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
    deletedFiles.push({filename: content.replace(S3_URL, '')});
  });

  await DB.asyncQ((db, resolve, reject) => {
    db.collection('deleted_files').insertMany(deletedFiles, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  });

  DB.q(next, db => {
    db.collection('episode').deleteOne({ _id }, (err, result) => {
      if (err) {
        return next(err);
      }
      res.redirect(`/series/${series.slug}`);
    });
  });
});

module.exports = router;
