
"use strict";

var fmt = require("util").format;

// Mini-logger.
var colors = {
  warn: "\u001b[93m[warn]\u001b[0m",
  error: "\u001b[91m[error]\u001b[0m",
  info: "\u001b[96m[info]\u001b[0m",
  debug: "\u001b[92m[debug]\u001b[0m"
};

var Logger = module.exports = {
  suppressWarnings: false,
  messageFormatter: function messageFormatter(level, args) {
    let date = new Date().toISOString();
    date = date.substr(0, date.indexOf(".")).replace("T", " ").trim();
    date = fmt("\u001b[90m%s\u001b[0m", date);
    let str = fmt.apply(undefined, args);
    return fmt("%s %s %s", date, colors[level], str);
  },
  transport: function transport(level, msg) {
    let fn = ~["warn", "error"].indexOf(level) ? "log" : "error";
    console[fn](msg);
  },
  log: function log(level) {
    if (level === "warn" && this.suppressWarnings) {
      return;
    }

    let args = Array.prototype.slice.call(arguments, 1);

    let str = this.messageFormatter(level, args);
    this.transport(level, str, args);
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