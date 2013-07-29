'use strict';

var MongoClient = require('mongodb').MongoClient;
var log = require('clifier').helpers.log;

module.exports = function(database, callback){
  var config = require('../utils/loadConfig');
  var connectstr = 'mongodb://'+config.host+':'+config.port+'/'+database;


  if (database === void(0)) {
    log.error("A database name is required\n\n");
    process.exit();
  }

  MongoClient.connect(connectstr, function(err, db) {
    if (err) {
      throw err;
    }

    db.dropDatabase(function(){
      if (callback) {
        callback();
      } else {
        log.write("Database "+database+" deleted\n");
        process.exit();
      }
    });
  });
};