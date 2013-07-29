'use strict';

var MongoClient = require('mongodb').MongoClient;
var log = require('clifier').helpers.log;

module.exports = function(database, name){
  var config = require('../utils/loadConfig');
  var connectstr = 'mongodb://'+config.host+':'+config.port+'/'+database;
  var usersCollection;

  if (database === void(0)) {
    log.error("A database is required\n\n");
    process.exit();
  }

  if (name === void(0)) {
    log.error("A user name is required\n\n");
    process.exit();
  }

  MongoClient.connect(connectstr, function(err, db) {
    if (err) {
      throw err;
    }

    usersCollection = db.collection('users');
    usersCollection.findAndModify({name: name}, {}, {}, {remove: true}, function(err){
      if (err) {
        log.error("User "+name+" don't exists\n");
      } else {
        log.write("User "+name+" deleted\n");  
      }
      
      process.exit();
    });

  });
};