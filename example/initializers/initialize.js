'use strict';
let utils = require('../../lib/utils');

module.exports = function () {

  return utils.delay(1000).then(function () {
    console.log('rapraparp');
    return utils.delay(500);
  });
};
