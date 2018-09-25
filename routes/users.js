const express = require('express');
const router = express.Router();
const DB = require('../db');
const auth = require('../auth');

/* GET users listing. */
router.get('/', (req, res, next) => {
  DB.q(next, db => {
    db.collection('users').find().toArray((err, users) => {
      if (err) {
        return next(err);
      }

      if (!users.find(user => user.admin && user.email === req.email)) {
        return res.redirect('/');
      }
      res.render('users', { users });
    });
  });
});

router.post('/', (req, res, next) => {
  const user = { email: req.body.email.trim(), admin: req.body.admin };
  DB.q(next, db => {
    db.collection('users').insertOne(user, (err, result) => {
      if (err) {
        return next(err);
      }

      auth.loadAuthorizer( users => {
        req.app.set('authorizer', users);
        res.redirect('/users');
      });
    });
  });
});

router.delete('/', (req, res, next) => {
  const email = req.body.email;
  if (email === 'isyoon@tapasmedia.co') {
    return res.redirect('/users');
  }

  DB.q(next, db => {
    db.collection('users').deleteOne({ email }, (err, result) => {
      if (err) {
        return next(err);
      }
      auth.loadAuthorizer( users => {
        req.app.set('authorizer', users);
        res.redirect('/users');
      });
    });
  });
});

module.exports = router;
