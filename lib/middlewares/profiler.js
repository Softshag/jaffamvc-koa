"use strict";

var compare, formatBytes, row;

compare = function (ctx, start, end) {
  console.log();
  row(ctx.method, ctx.url);
  row("response time:", end.time - start.time + "ms");
  row("memory rss:", formatBytes(end.mem.rss - start.mem.rss));
  //row("memory vsize:", formatBytes(end.mem.vsize - start.mem.vsize));
  row("heap before:", formatBytes(start.mem.heapUsed) + " / " + formatBytes(start.mem.heapTotal));
  row("heap after:", formatBytes(end.mem.heapUsed) + " / " + formatBytes(end.mem.heapTotal));
  return console.log();
};

/*
Row helper

@param {String} key
@param {String} val
@api private
*/

row = function (key, val) {
  return console.log("  \u001b[90m%s\u001b[0m \u001b[36m%s\u001b[0m", key, val);
};

/*
Format byte-size.

@param {Number} bytes
@return {String}
@api private
*/

formatBytes = function (bytes) {
  var gb, kb, mb;
  kb = 1024;
  mb = 1024 * kb;
  gb = 1024 * mb;
  if (bytes < kb) {
    return bytes + "b";
  }
  if (bytes < mb) {
    return (bytes / kb).toFixed(2) + "kb";
  }
  if (bytes < gb) {
    return (bytes / mb).toFixed(2) + "mb";
  }
  return (bytes / gb).toFixed(2) + "gb";
};

module.exports = function (memwatch) {

  return function* (next) {
    var end, snapshot, start;
    snapshot = function () {
      return {
        mem: process.memoryUsage(),
        time: new Date()
      };
    };
    start = snapshot();
    yield* next;
    compare(this, start, snapshot());
  };
};