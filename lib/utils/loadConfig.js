'use strict';

module.exports = (function(){
  var config;

  try {
    config = require('../../config.json');
  } catch (error) {
    console.log('You must use db:config before other commands');
    process.exit();
  }

  return config;
})();