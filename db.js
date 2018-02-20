const MongoClient = require('mongodb').MongoClient;
let db;
exports.connect = (cb) => {
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

exports.q = (cb) => {
  const err = !(db) ? new Error('No db connection.') : false;
  cb(err, db);
}
