'use strict';

var createDatabase = require('../lib/commands/createDatabase');
var deleteDatabase = require('../lib/commands/deleteDatabase');
var apikey = null;
var id = null;

var api = require('../lib/server');
var stubs;
var databasename = (new Date()).getTime();

module.exports = {
  setUp: function (callback) {
    createDatabase(databasename, 'admin', function(user){
      apikey = user.apikey;
      id = user._id;
      callback();
    });

    stubs = require('./stubs');
    stubs.request.events = {};
  },

  "send error 400 when missing database name": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 400);
      test.equal(stubs.response.content.content, "Missing database");
      test.done();
    };

    stubs.request.url = '/api';
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },

  "send error 400 when missing collection name": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 400);
      test.equal(stubs.response.content.content, "Missing collection");
      test.done();
    };

    stubs.request.url = '/database/'+databasename;
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },

  "send error 400 when missing apikey": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 400);
      test.equal(stubs.response.content.content, "Missing api key");
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/test';
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },

  "send error 400 when missing user name": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 400);
      test.equal(stubs.response.content.content, "Missing user");
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/test?apikey='+apikey;
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },

  "send error 401 when bad api key": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 401);
      test.equal(stubs.response.content.content, "Forbidden");
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/test?apikey=1234&user=admin';
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },

  "Status 200 when all infos are ok": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 200);
      test.equal(stubs.response.content.data.length, 0);
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/test?apikey='+apikey+'&user=admin';
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },

  "Status 200 when insert data": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 200);
      test.equal(stubs.response.content.data[0].name, 'test');
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/test';
    stubs.request.method = "POST";

    api(stubs.request, stubs.response);

    stubs.request.emit('data', ['name=test&password=1345&comment=hello%20!&apikey='+apikey+'&user=admin']);
    stubs.request.emit('end');
  },

  "Status 200 when get data": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 200);
      test.equal(stubs.response.content.data[0].name, 'admin');
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/users?apikey='+apikey+'&user=admin';
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },

  "Status 200 when get data but empty": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 200);
      test.equal(stubs.response.content.data.length, 0);
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/users?apikey='+apikey+'&user=admin&readonly=0';
    stubs.request.method = "GET";

    api(stubs.request, stubs.response);
  },


  "Status 200 when put data": function(test){
    test.expect(2);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 200);
      test.equal(stubs.response.content.data.readonly, true);
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/users';
    stubs.request.method = "PUT";

    api(stubs.request, stubs.response);

    stubs.request.emit('data', ['readonly=1&apikey='+apikey+'&user=admin&id='+id]);
    stubs.request.emit('end');
  },


  "Status 200 when delete data": function(test){
    test.expect(1);

    stubs.response.end = function(){
      test.equal(stubs.response.status, 200);
      test.done();
    };

    stubs.request.url = '/database/'+databasename+'/collection/users?apikey='+apikey+'&user=admin&id='+id;
    stubs.request.method = "DELETE";

    api(stubs.request, stubs.response);
  },
  
  tearDown: function (callback) {
    deleteDatabase(databasename, callback);
    stubs.response.end = function(){};
  }
};