'use strict';

var http = require("http");
var url = require("url");
var queryString = require('querystring');
var events = require('events').EventEmitter;
var config = require('./utils/loadConfig');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'all-logs.log'})
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ]
});

var eventEmitter = new events();
var parseRegexp = new RegExp('\/database\/([a-zA-Z0-9_-]+)(\/collection\/([a-zA-Z0-9_-]+)(\/(.*))?)?');

/*******************************************/
/*******************************************/
/************** Parse sent uri *************/
/*******************************************/
/*******************************************/

var parseUri = function(data, request, response) {
  var uri = url.parse(request.url, true).pathname;
  var matched = parseRegexp.exec(uri);
  var infos = {};

  if (matched === null || matched[1] === void(0)) {
    return eventEmitter.emit('endRequest',  {content: "Missing database", type: 400}, response); 
  }

  if (matched[3] === void(0)) {
    return eventEmitter.emit('endRequest',  {content: "Missing collection", type: 400}, response); 
  }

  infos.database = matched[1];
  infos.collection = matched[3];
  infos.id = matched[5];

  eventEmitter.emit('endParseUri', data, infos, request, response);
};

/*******************************************/
/*******************************************/
/************** Check sent key *************/
/*******************************************/
/*******************************************/

var checkApiKey = function(data, infos, request, response) {
  if (!data.apikey) {
    return eventEmitter.emit('endRequest',  {content: "Missing api key", type: 400}, response);
  }

  if (!data.user) {
    return eventEmitter.emit('endRequest',  {content: "Missing user", type: 400}, response); 
  }

  var users = response.db.collection('users');

  users.findOne({apikey: data.apikey, name: data.user}, function(err, user){
    if (err) {
      logger.warn(err);
      return eventEmitter.emit('endRequest',  {content: "Server error", type: 500}, response);
    }

    if (user === null) {
      return eventEmitter.emit('endRequest',  {content: "Forbidden", type: 401}, response);  
    }

    if (user.readonly && (request.method !== "GET" || infos.collection === "users")) {
      return eventEmitter.emit('endRequest',  {content: "User is readonly", type: 405}, response);   
    }

    eventEmitter.emit('apiKeyChecked', data, infos, request, response);
  });
};

/*******************************************/
/*******************************************/
/************* Parse sent data *************/
/*******************************************/
/*******************************************/

var parseQueryStringData = function(request, response){
  var body = "";

  request.on('data', function(data){
    body += data;
  });

  request.on('end', function(){
    eventEmitter.emit('endParseData', queryString.parse(body), request, response);
  });
};

var parseUrlData = function(request, response){
  var data = url.parse(request.url, true).query;

  eventEmitter.emit('endParseData', data, request, response);
};

var parseData = function(data) {
  var cleanData = {};

  for (var i in data) {
    if (data.hasOwnProperty(i) && ['apikey', 'user', 'sort', 'order', 'limit', 'skip'].indexOf(i) === -1) {
      cleanData[i] = data[i];
    }
  }

  return cleanData;
};

/*******************************************/
/*******************************************/
/*********** Process the request ***********/
/*******************************************/
/*******************************************/

var proccessRequest = function(data, infos, request, response) {

  var collection = response.db.collection(infos.collection);
  var cleanData = parseData(data);
  var query = null;
  var sort = {};
  var req;

  if (infos.id) {
    query = {}; // prevent limit/sort ... to by use with id
    query['_id'] = new ObjectID(infos.id);
  }


  switch (request.method) {
    case "POST":
      collection.insert(cleanData, function(err, doc){
        if (err) {
          logger.warn(err);
          return eventEmitter.emit('endRequest',  {content: 'error during data save', type: 500}, response); 
        }

        return eventEmitter.emit('endRequest',  {data: doc, type: 200}, response); 
      });
    break;

    case "PUT":
      collection.findAndModify(query || {}, {}, {$set:cleanData}, {new: true}, function(err, updateData){
        if (err) {
          logger.warn(err);
          return eventEmitter.emit('endRequest',  {content: 'error during update', type: 500}, response); 
        }

        return eventEmitter.emit('endRequest',  {data: updateData, type: 200}, response); 
      });
    break;

    case "DELETE":
      collection.findAndModify(query || {}, {}, {}, {remove: true}, function(err){
        if (err) {
          logger.warn(err);
          return eventEmitter.emit('endRequest',  {content: 'error during delete', type: 500}, response); 
        }

        return eventEmitter.emit('endRequest',  {type: 200}, response); 
      });
    break;

    default :
      req = collection.find(query || cleanData);

      if (data.offset && !infos.id) {
        req.skip(parseInt(data.skip, 10));
      }

      if (data.limit && !infos.id) {
        req.limit(parseInt(data.limit, 10));
      }

      if (data.sort && !infos.id) {
        sort[data.sort] = data.order !== void(0) ? parseInt(data.order, 10) : -1;
        req.sort(sort);
      }

      req.toArray(function(err, items) {
        if (err) {
          logger.warn(err);
          return eventEmitter.emit('endRequest',  {content: 'error proccessing mongodb query', type: 500}, response); 
        }

        return eventEmitter.emit('endRequest',  {data: items, total: collection.count(), type: 200}, response);
      });
  }
};

/*******************************************/
/*******************************************/
/************** Manage events **************/
/*******************************************/
/*******************************************/

process.on('uncaughtException', function(err){
  logger.warn(err);
});

eventEmitter.on('endParseData', function(data, request, response){
  parseUri(data, request, response);
});

eventEmitter.on('endParseUri', function(data, infos, request, response){
  var connectstr = 'mongodb://'+config.host+':'+config.port+'/'+infos.database;

  MongoClient.connect(connectstr, function(err, db) {
    if (err) {
      logger.warn(err);
      return eventEmitter.emit('endRequest',  {content: "Error while connecting database", type: 500}, response);
    }

    response.db = db;

    eventEmitter.emit('databaseConnected', data, infos, request, response);
  });
});

eventEmitter.on('databaseConnected', function(data, infos, request, response){
  checkApiKey(data, infos, request, response);
});

eventEmitter.on('apiKeyChecked', function(data, infos, request, response){
  proccessRequest(data, infos, request, response);
});

eventEmitter.on("endRequest", function(content, response){
  if (response.db) {
    response.db.close(); 
  }

  if (response.timeout) {
    clearTimeout(response.timeout);
  }

  response.writeHead(content.type || 400, {"Content-Type": "application/json"});
  response.write(JSON.stringify(content));
  response.end();
});

/*******************************************/
/*******************************************/
/************** Init server ****************/
/*******************************************/
/*******************************************/

var serverCallback = function(request, response) {
  var method = request.method;

  if (request.connection) {
    logger.info(request.connection.remoteAddress + " : " + request.method + " " + request.url); 
  }

  switch (method) {
    case "POST":
    case "PUT":
      parseQueryStringData(request, response);
      break;

    default:
      parseUrlData(request, response);
      break;
  }

  response.timeout = setTimeout(function(){
    eventEmitter.emit('endRequest',  {content: "I'm a teapot. Look's like an error append, but I don't know why...", type: 418}, response);   
  }, 5000);
};

/*******************************************/
/*******************************************/
/************** Start server ***************/
/*******************************************/
/*******************************************/

if (require.main === module) {
  console.log('direct run of server script');
  http.createServer(serverCallback).listen(8080);
} else {
  module.exports = serverCallback;
}