'use strict';

var fs = require('fs'),
    Path = require('path'),
    Promise = require('bluebird'),
    //deprecate = require('depd')('jaffamvc-koa'),
    co = require('co');

var eachAsync = exports.eachAsync = function (array, iterator) {
  return new Promise(function (resolve,reject) {
    var i = 0, len = array.length, next;
    next = function(e) {
      if (e != null || i === len)
        return e ? reject(e) : resolve();
      iterator(array[i++], next);
    };
    next(null);
  });
};

['Array', 'String'].forEach(function (e) {
  exports['is'+e] = function (arg) {
    return Object.prototype.toString.call(arg) === '[object ' + e + ']';
  };
});


var camelize = exports.camelize = function (str) {
  return str.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

var __slice = exports.slice = Array.prototype.slice;

// Deprecate: use object-assign instead.
/*var extend = exports.extend = deprecate.function(function extend () {
  var o, a, b, p, i;
  a = arguments[0], b = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  for (i = 0; i < b.length; i++) {
    if ((o = b[i]) == null) continue;
    for (p in o) a[p] = o[p];
  }
  return a;
});*/

exports.exts = ['.js','.coffee'];

exports.resolveFile = function (dir, name, suffix, exts) {
  dir = Path.resolve(dir);
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
  if (exts == null) exts = exports.exts;

  for (i = 0; i < exts.length; i++) {
    f = fileName + exts[i];
    if (fileExistsSync(f)) {
      return f;
    }
  }
  return null;
};


var fileExists = exports.fileExists = function (file, cb) {
  return new Promise(function (resolve, reject) {
      fs.stat(file, function (err) {
        if (err) {
          if (err.code == 'ENOENT') {
            return resolve(false);
          }
          return reject(err);
        }

        resolve(true);

      });
  });
};

var fileExistsSync = exports.fileExistsSync = function (file) {
  try {
    var stat = fs.statSync(file);
    return stat != null;
  } catch (e) {
    return false;
  }
};

// TODO: Handle sub directories.
var requireDir = exports.requireDir = function (path, cb, exts, recursive) {
  recursive = recursive || false;

  var readdir = Promise.promisify(fs.readdir);
  var stat = Promise.promisify(fs.stat);

  exts = exts || exports.exts;

  return co(function *() {
    var stats, fp,file,mod, files = yield readdir(path);
    files.sort();

    for (var i=0;i<files.length;i++) {
      file = files[i];
      fp = Path.join(path, file), mod;
      if (file[0] === '.') continue;

      stats = yield stat(fp);

      if (stats.isDirectory()) {
        if (!recursive) continue;

        yield requireDir(fp,cb,exts,true);

      } else if (stats.isFile()) {
        if (exts.indexOf(Path.extname(file)) === -1)
          continue;


        mod = requireFile(fp);

        yield cb(mod, fp);
      }

    }

    return files;

  });

};

function requireFile (file) {
  var ext = Path.extname(file);

  if (ext === '.json') {
    return require(file);

  } else if (ext === '.js') {
    return require(file);

  } else if (ext === '.coffee') {
    var coffee = require('coffee-script');
    if (typeof coffee.register === 'function')
      coffee.register();
    return require(file);

  } else if (ext === '.cson') {
    var cson = require('cson');
    return cson.requireFile(file);

  } else if (ext === '.yaml') {
    var yaml = require('js-yaml');
    return yaml.safeLoad(fs.readFileSync(file,'utf-8'));

  } else if (ext == '.toml') {
    var toml = require('toml');
    return toml.parse(fs.readFileSync(file, 'utf-8'))
  } else if (ext == '.ls') {
    require('LiveScript');
    return require(file);
  }

  throw new Error('No parser found')
}


/**
 * Check if `obj` is yieldable (via co)
 */
exports.isYieldable = function isYieldable(obj) {
  return isPromise(obj) || isGenerator(obj) || isGeneratorFunction(obj);
};
/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}
