'use strict';

module.exports = {
  request : {
    events: {},

    on: function(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }

      this.events[event].push(callback);
    },

    emit: function(event, args) {
      if (!this.events[event]) {
        return;
      }

      for (var i = 0; i < this.events[event].length; i++) {
        this.events[event][i].apply(null, args);
      }
    }
  },

  response: {
    status: null,
    headers : {},
    content : null,

    writeHead : function(status, headers) {
      this.status = status;
      this.headers = headers; 
    },

    write : function(content) {
      this.content = JSON.parse(content);
    }
  }
};