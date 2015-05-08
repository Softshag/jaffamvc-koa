
"use strict";

var fmt = require("util").format;

// Mini-logger.
var colors = {
  warn: "\u001b[93m[warn]\u001b[0m ",
  error: "\u001b[91m[error]\u001b[0m ",
  info: "\u001b[96m[info]\u001b[0m ",
  debug: "\u001b[92m[debug]\u001b[0m "
};

var Logger = module.exports = {
  log: function log(level) {
    var args, fn, str;
    args = Array.prototype.slice.call(arguments, 1);

    let date = new Date().toISOString();
    date = date.substr(0, date.indexOf(".")).replace("T", " ").trim();
    date = fmt("\u001b[90m%s\u001b[0m", date);
    fn = ~["warn", "error"].indexOf(level) ? "log" : "error";
    str = fmt.apply(undefined, args);
    console[fn](date, colors[level] + str);
  }
};

["warn", "error", "debug", "info"].forEach(function (level) {
  Logger[level] = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    Logger.log.apply(Logger, [level].concat(args));
  };
});