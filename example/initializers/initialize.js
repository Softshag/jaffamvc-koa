
var Promise = require('bluebird');

module.exports = function * () {

  return Promise.delay(2000).then(function () {
    console.log('tjopper');

    
  });
};
