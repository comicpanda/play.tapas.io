const DB = require('./db');

exports.loadAuthorizer = cb => {
  DB.q((err) => {
    throw err;
  }, db => {
    db.collection('users').find().toArray((err, users) => {
      if (err) {
        throw err;
      }
      let authorizer = {};
      users.forEach(user => {
        authorizer[user.email] = user.admin || false;
      });
      cb(authorizer);
    });
  });
}
