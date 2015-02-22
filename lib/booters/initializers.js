"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var utils = _interopRequireWildcard(require("../utils"));

var Path = _interopRequire(require("path"));

var dbg = _interopRequire(require("debug"));

let debug = dbg("mvc:boot");

module.exports = function (path, ctx) {

  if (!utils.fileExistsSync(path)) throw new Error("path " + path + " does not exists!");

  path = Path.resolve(path);

  return function () {
    ctx = ctx || this;
    return utils.requireDir(path, function* (mod, file) {
      debug("evaluating %s", file);
      return yield mod.call(ctx);
    });
  };
};