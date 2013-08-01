'use strict';

var http = require('http');

module.exports = function(port){
  var config = require('../utils/loadConfig');

  port = port || config.apiport || "8080";
  var server = require('../server');

  http.createServer(server).listen(port);

  console.log("Start server on port "+port);
  console.log("Use CTRL+C to stop server");
};