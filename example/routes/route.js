
'use strict';

module.exports = function *() {

  this.get('/', function *() {
    this.body = "Hello World!";
  });

  this.match('/home','home#index', {
    hello: 'World'
  });

  this.namespace('/api', function () {
    this.get('/', function *() {
      this.body = "RAPRAP";
    });
  });

};
