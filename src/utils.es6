'use strict';

import fs from 'mz/fs';
import Path from 'path';
import co from './co';

export var Promise = require('native-or-bluebird');

export function camelize (str) {
  return str.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
}


export let exts = ['.js','.coffee'];

export function resolveFile (dir, name, suffix, exts) {
  dir = Path.resolve(dir);
  var f, i, p;
  suffix = suffix || '-controller';
  name = name.toLowerCase();

  p = [name+suffix,camelize(name+suffix)];

  for (i = 0; i < p.length; i++) {
    f = Path.join(dir,p[i]);
    f = resolveExt(f,exts);
    if (f) return f;
  }

}

export function resolveExt( fileName, exts) {
  var f, i;
  if (exts == null) exts = exports.exts;

  for (i = 0; i < exts.length; i++) {
    f = fileName + exts[i];
    if (fileExistsSync(f)) {
      return f;
    }
  }
  return null;
}


export function fileExists (file) {
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
}

export function fileExistsSync (file) {
  try {
    let stat = fs.statSync(file);
    return stat != null;
  } catch (e) {
    return false;
  }
}

export function requireDir (path, cb, exts, recursive) {

  recursive = recursive || false;

  exts = exts || exports.exts;

  return co(function *() {

    var stats, fp, file, mod;
    let files = yield fs.readdir(path);

    files.sort();

    for (var i=0;i<files.length;i++) {
      file = files[i];

      // Ignore hidden files
      if (file[0] === '.') continue;

      fp = Path.join(path, file);

      stats = yield fs.stat(fp);

      if (stats.isDirectory()) {
        if (!recursive) continue;

        yield exports.requireDir(fp,cb,exts,true);

      } else if (stats.isFile()) {
        if (!~exts.indexOf(Path.extname(file)))
          continue;

        mod = yield loadFile(fp);

        yield cb(mod, fp);
      }

    }

    return files;

  });

}

function *loadFile (file) {
  var ext = Path.extname(file);

  if (ext === '.json') {
    return require(file);

  } else if (ext === '.js') {
    return require(file);

  } else if (ext === '.coffee') {
    let coffee = require('coffee-script');
    if (typeof coffee.register === 'function')
      coffee.register();
    return require(file);

  } else if (ext === '.cson') {
    let cson = require('cson');
    return cson.requireFile(file);

  } else if (ext === '.yaml') {
    let yaml = require('js-yaml');
    let data = yield fs.readFile(file,'utf8');
    return yaml.safeLoad(data);

  } else if (ext == '.toml') {
    let toml = require('toml');
    let data = yield fs.readFile(file,'utf8');
    return toml.parse(data);

  } else if (ext == '.ls') {
    require('LiveScript');
    return require(file);
  }

  throw new Error('No parser found');
}


/**
 * Check if `obj` is yieldable (via co)
 */
export function isYieldable (obj) {
  return isPromise(obj) || isGenerator(obj) || isGeneratorFunction(obj);
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
export function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
export function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
export function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

export function delay(t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}




