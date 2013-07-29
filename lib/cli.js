'use strict';

var clifier = require('clifier');
var pack = require("../package.json");
var commands = require('./commands');
var http = require('http');

var cli = new clifier.Cli(pack.name, pack.version, "Cli tool to manage database and rest users");

cli.addCommand('init', 'config your mongo server', commands.initServer)
  .addArgument('-host', 'host of your database')
  .addArgument('-port', 'port of your database')
  .addArgument('-apiport', 'port of your api');

cli.addCommand('server:start', 'start your MongoRest server', function(port){
    port = port || "8080";
    var server = require('./server');
    http.createServer(server).listen(port || '8080');
    clifier.helpers.log.write("Start server on port "+port+"\n");
    clifier.helpers.log.error("Use CTRL+C to stop server\n");
  })
  .addArgument('-port', 'port of your server');

cli.addCommand('db:create', 'create a new database', commands.createDatabase)
  .addArgument('-database', 'name of the database')
  .addArgument('-user', 'A read/write user for this database (default admin)');

cli.addCommand('db:delete', 'delete a database', commands.deleteDatabase)
  .addArgument('-database', 'name of the database');

cli.addCommand('user:add', 'add a user to a database', commands.addUser)
  .addArgument('-database', 'name of the database')
  .addArgument('-name', 'user login')
  .addArgument('-readonly', 'user can\'t update data (default false)', false);

cli.addCommand('user:delete', 'remove a user from a database', commands.deleteUser)
  .addArgument('-database', 'name of the database')
  .addArgument('-name', 'user login');

module.exports = cli;