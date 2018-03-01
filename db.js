const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

let db;
exports.connect = cb => {
  MongoClient.connect(process.env.MONGODB_URI, function(err, client) {
    if (err) {
      console.log('error', err);
    } else {
      const dbName = client.s.options.dbName;
      console.log('Connected successfully to server - DB : ', dbName);
      db = client.db(dbName);
      cb();
    }
  });
}

exports.q = (next, cb) => {
  if (!db) {
    next(new Error('No db connection.'));
  } else {
    cb(db);
  }
}

exports.asyncQ = cb => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('No db connection.'));
    } else {
      cb(db, resolve, reject);
    }
  });
}

exports.ObjectId = ObjectId;
