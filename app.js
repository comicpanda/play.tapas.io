const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const index = require('./routes/index');
const users = require('./routes/users');
const series = require('./routes/series');
const actions = require('./routes/actions');
const app = express();

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

//https://stackoverflow.com/a/33905671/194274
app.use((req, res, next) => {
  const authorizer = app.get('authorizer');

  const b64auth = new Buffer((req.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
  const colonIdx = b64auth.indexOf(':');
  const username = b64auth.substring(-1, colonIdx);
  const password = b64auth.substring(colonIdx + 1);

  if (authorizer[username] === undefined || authorizer[username] !== password) {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
    return;
  }
  next();
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
