
'use strict';

var fmt = require('util').format;

// Mini-logger. 
var colors = {
  warn: '\u001b[93mwarn\u001b[0m',
  error: '\u001b[91merror\u001b[0m',
  info: '\u001b[96minfo\u001b[0m',
  debug: '\u001b[92mdebug\u001b[0m'
};

var Logger = module.exports = {
  log: function (level) {
    var args, fn, str;
    args = Array.prototype.slice.call(arguments, 1);

    fn = (~['warn','error'].indexOf(level)) ? "log" : "error";
    str = fmt.apply(undefined, args);
    console[fn]('['+ colors[level] + '] ' + str);
  }
};

['warn','error','debug','info'].forEach(function (level) {
  Logger[level] = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(level);
    Logger.log.apply(Logger, args);
  };
});
