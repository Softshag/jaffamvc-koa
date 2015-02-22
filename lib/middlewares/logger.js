"use strict";

var format = require("util").format;

module.exports = function () {

  return function* (next) {
    let ss = new Date();

    yield* next;

    let diff = new Date() - ss;

    let req = this.request;
    let str = format("%s [%s] \"%s %s\" %s %s ms\n", req.ip, ss.toISOString(), req.method, req.originalUrl, this.status, diff);

    process.stdout.write(str);
  };
};