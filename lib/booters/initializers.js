
'use strict';

var fs = require('fs'),
    Utils = require('../utils'),
    Path = require('path'),
    debug = require('debug')('mvc:boot');

module.exports = function (path, ctx) {

  if (!fs.existsSync(path))
    throw new Error('path ' + path + ' does not exists!');

  path = Path.resolve(path);

  return function () {
    ctx = ctx || this;
    return Utils.requireDir(path, function (mod, file, next) {

      debug('evaluating %s',file);

      if (mod.length === 1)
        return mod.call(ctx, next);

      setImmediate(function () {
        mod.call(ctx);
        next();
      });
    });
  };

};
