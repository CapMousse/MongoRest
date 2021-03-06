'use strict';

var MongoClient = require('mongodb').MongoClient;
var log = require('clifier').helpers.log;

module.exports = function(database, name, readonly){
  var config = require('../utils/loadConfig');
  var connectstr = 'mongodb://'+config.host+':'+config.port+'/'+database;
  var usersCollection;
  var apikey;
  var user;

  if (database === void(0)) {
    log.error("A database is required\n\n");
    process.exit();
  }

  if (name === void(0)) {
    log.error("A user name is required\n\n");
    process.exit();
  }

  readonly = (readonly === void(0)) ? true : readonly;

  MongoClient.connect(connectstr, function(err, db) {
    if (err) {
      throw err;
    }

    usersCollection = db.collection('users');
    usersCollection.find({name: name}).toArray(function(err, users){
      if (err) {
        throw err;
      }

      if (users.length > 0) {
        log.error("User already exists\n\n");
        process.exit();
      }

      apikey = Math.floor(Math.random() * 10000000000000001 * (new Date()).getTime()).toString(36);
      user = {
        name: name,
        readonly: !!readonly,
        apikey: apikey
      };

      usersCollection.insert(user, function(err){
        if (err) {
          log.error("Error during user creation\n\n");
        } else {
          log.write("User "+user.name+" created with apikey : "+user.apikey+" \n");  
        }
        
        process.exit();
      });
    });

  });
};