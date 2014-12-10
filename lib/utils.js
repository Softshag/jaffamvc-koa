'use strict';

var fs = require('fs'),
    Path = require('path'),
    Promise = require('bluebird');

var eachAsync = exports.eachAsync = function (array, iterator, done) {
  return new Promise(function (resolve,reject) {
    var i = 0, len = array.length, next;
    next = function(e) {
      if (e != null || i === len)
        return e ? reject(e) : resolve();
      iterator(array[i++], next);
    };
    next(null);
  }).nodeify(done);
};

['Array', 'String'].forEach(function (e) {
  exports['is'+e] = function (arg) {
    return Object.prototype.toString.call(arg) === '[object ' + e + ']';
  };
});


var camelize = exports.camelize = function (str) {
  return str.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

var __slice = Array.prototype.slice;

var extend = exports.extend = function () {
  var o, a, b, p, i;
  a = arguments[0], b = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  for (i = 0; i < b.length; i++) {
    if ((o = b[i]) == null) continue;
    for (p in o) a[p] = o[p];
  }
  return a;
};

exports.resolveFile = function (dir, name, suffix, exts) {
  var f, i, p;
  suffix = suffix || '-controller';
  name = name.toLowerCase();

  p = [name+suffix,camelize(name+suffix)];

  for (i = 0; i < p.length; i++) {
    f = Path.join(dir,p[i]);
    f = exports.resolveExt(f,exts);
    if (f) return f;
  }

};

exports.resolveExt = function(fileName, exts) {
  var f, i;
  if (exts == null) exts = ['js'];

  for (i = 0; i < exts.length; i++) {
    f = fileName + '.' + exts[i];
    if (fs.existsSync(f)) {
      return f;
    }
  }
  return null;
};

exports.requireDir = function (path, cb, exts) {
  var readdir = Promise.promisify(fs.readdir);
  exts = exts || ['.js'];
  return readdir(path).then(function (files) {
    return eachAsync(files.sort(), function (file, next) {

      if (file[0] === '.' || exts.indexOf(Path.extname(file)) == -1) return next();
      var fp = Path.join(path, file), mod;
      try {
        mod = require(fp);
      } catch (e) {
        return next(e);
      }
      cb(mod, fp, next);
    });
  });

};
