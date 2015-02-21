
"use strict";

var fs = require("fs"),
    Utils = require("../utils"),
    Path = require("path"),
    co = require("co"),
    debug = require("debug")("mvc:boot");

module.exports = function (path, ctx) {
  if (!Utils.fileExistsSync(path)) throw new Error("path " + path + " does not exists!");

  path = Path.resolve(path);

  return function () {
    ctx = ctx || this;
    return Utils.requireDir(path, function* (mod, file) {
      debug("evaluating %s", file);
      return yield mod.call(ctx);
    });
  };
};