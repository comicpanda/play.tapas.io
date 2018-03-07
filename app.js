const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fireAdmin = require('firebase-admin');


const index = require('./routes/index');
const users = require('./routes/users');
const series = require('./routes/series');
const actions = require('./routes/actions');
const auth = require('./routes/auth');
const app = express();
const session = {};

fireAdmin.initializeApp({
  credential: fireAdmin.credential.cert(
    JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii'))
  ),
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', auth);

app.use((req, res, next) => {
  if (!req.cookies.uid) {
    return res.redirect('/auth');
  }
  let uid = req.cookies.uid;
  if (session[uid]) {
    req.uid = uid;
    res.locals.uid = uid;
    next();
  } else {
    const authorizer = app.get('authorizer');
    fireAdmin.auth().getUser(uid)
      .then(() => {
        session[uid] = true;
        res.locals.uid = uid;
        setTimeout(() => {
          delete session[uid];
        }, 60 * 60 * 1000);
        next();
      }).catch(error => {
        res.redirect('/auth');
      });
  }
});

app.use('/', index);
app.use('/users', users);
app.use('/series', series);
app.use('/a', actions);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
