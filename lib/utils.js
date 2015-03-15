"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.camelize = camelize;
exports.resolveFile = resolveFile;
exports.resolveExt = resolveExt;
exports.fileExists = fileExists;
exports.fileExistsSync = fileExistsSync;
exports.requireDir = requireDir;

/**
 * Check if `obj` is yieldable (via co)
 */
exports.isYieldable = isYieldable;

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
exports.isPromise = isPromise;

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
exports.isGenerator = isGenerator;

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
exports.isGeneratorFunction = isGeneratorFunction;
exports.delay = delay;

var fs = _interopRequire(require("mz/fs"));

var Path = _interopRequire(require("path"));

var Promise = _interopRequire(require("native-or-bluebird"));

var co = _interopRequire(require("co"));

function camelize(str) {
  return str.replace(/(\-[a-z])/g, function ($1) {
    return $1.toUpperCase().replace("-", "");
  });
}

let exts = exports.exts = [".js", ".coffee"];

function resolveFile(dir, name, suffix, exts) {
  dir = Path.resolve(dir);
  var f, i, p;
  suffix = suffix || "-controller";
  name = name.toLowerCase();

  p = [name + suffix, camelize(name + suffix)];

  for (i = 0; i < p.length; i++) {
    f = Path.join(dir, p[i]);
    f = resolveExt(f, exts);
    if (f) {
      return f;
    }
  }
}

function resolveExt(fileName, exts) {
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

function fileExists(file) {
  return new Promise(function (resolve, reject) {
    fs.stat(file, function (err) {
      if (err) {
        if (err.code == "ENOENT") {
          return resolve(false);
        }
        return reject(err);
      }

      resolve(true);
    });
  });
}

function fileExistsSync(file) {
  try {
    let stat = fs.statSync(file);
    return stat != null;
  } catch (e) {
    return false;
  }
}

function requireDir(path, cb, exts, recursive) {

  recursive = recursive || false;

  exts = exts || exports.exts;

  return co(function* () {

    var stats, fp, file, mod;
    let files = yield fs.readdir(path);

    files.sort();

    for (var i = 0; i < files.length; i++) {
      file = files[i];

      // Ignore hidden files
      if (file[0] === ".") continue;

      fp = Path.join(path, file);

      stats = yield fs.stat(fp);

      if (stats.isDirectory()) {
        if (!recursive) continue;

        yield exports.requireDir(fp, cb, exts, true);
      } else if (stats.isFile()) {
        if (exts.indexOf(Path.extname(file)) === -1) continue;

        mod = loadFile(fp);

        yield cb(mod, fp);
      }
    }

    return files;
  });
}

function loadFile(file) {
  var ext = Path.extname(file);

  if (ext === ".json") {
    return require(file);
  } else if (ext === ".js") {
    return require(file);
  } else if (ext === ".coffee") {
    let coffee = require("coffee-script");
    if (typeof coffee.register === "function") coffee.register();
    return require(file);
  } else if (ext === ".cson") {
    let cson = require("cson");
    return cson.requireFile(file);
  } else if (ext === ".yaml") {
    let yaml = require("js-yaml");
    return yaml.safeLoad(fs.readFileSync(file, "utf-8"));
  } else if (ext == ".toml") {
    let toml = require("toml");
    return toml.parse(fs.readFileSync(file, "utf-8"));
  } else if (ext == ".ls") {
    require("LiveScript");
    return require(file);
  }

  throw new Error("No parser found");
}function isYieldable(obj) {
  return isPromise(obj) || isGenerator(obj) || isGeneratorFunction(obj);
}function isPromise(obj) {
  return "function" == typeof obj.then;
}function isGenerator(obj) {
  return "function" == typeof obj.next && "function" == typeof obj["throw"];
}function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) {
    return false;
  }if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName) {
    return true;
  }return isGenerator(constructor.prototype);
}

function delay(t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}
Object.defineProperty(exports, "__esModule", {
  value: true
});