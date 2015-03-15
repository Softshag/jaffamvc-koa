
'use strict';

module.exports = function *() {

  this.get('/', function *() {
    this.body = "Hello World!";
  });

  this.router.match('/home','home#index', {
    hello: 'World'
  });

};
