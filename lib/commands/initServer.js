'use strict';

var fs = require('fs');
var currentDir = process.cwd();
var log = require('clifier').helpers.log;

module.exports = function(host, port, apiport){
  host = host || "localhost";
  port = port || "27017";
  apiport = apiport || "8080";

  var config = {
    host : host,
    port : port,
    apiport : apiport
  };


  fs.writeFileSync(currentDir+'/config.json', JSON.stringify(config));
  log.write('config.json file create\n');
  process.exit();
};