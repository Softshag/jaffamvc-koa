
'use strict';

var fs = require('fs'),
    Utils = require('../utils'),
    Path = require('path'),
    co = require('co'),
    debug = require('debug')('mvc:boot');

module.exports = function (path, ctx) {

  if (!fs.existsSync(path))
    throw new Error('path ' + path + ' does not exists!');

  path = Path.resolve(path);

  return function () {
    ctx = ctx || this;
    return Utils.requireDir(path, function (mod, file, next) {

      debug('evaluating %s',file);

      co(function *() {
        yield mod.call(ctx);
      }).then(function () {
        next();
      }).catch(next);

    });
  };

};
