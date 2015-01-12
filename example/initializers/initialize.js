
var Promise = require('bluebird');

module.exports = function () {

  return Promise.delay(1).then(function () {
    console.log('tjopper');


  });
};
