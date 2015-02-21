"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var eos = _interopRequire(require("end-of-stream"));

var util = _interopRequire(require("util"));

var Promise = _interopRequire(require("bluebird"));

var dbg = _interopRequire(require("debug"));

var Utils = _interopRequire(require("./utils"));

let debug = dbg("mvc:boot");

function noop() {}

let Task = (function () {
  function Task(options) {
    _classCallCheck(this, Task);

    _get(Object.getPrototypeOf(Task.prototype), "constructor", this).call(this);
    this.options = options;
  }

  _prototypeProperties(Task, null, {
    run: {
      value: function run() {
        var _this3 = this;
        return new Promise(function (resolve, reject) {
          const done = function (err) {
            if (err) return reject(err);
            resolve();
          };

          var _options = _this3.options;
          const fn = _options.fn;
          const context = _options.context;


          if (fn.length === 1) {
            return fn.call(context, done);
          }

          const ret = fn.call(context);

          if (ret && ret instanceof Error) {
            reject(ret);
          } else if (ret && typeof ret.pipe === "function") {
            eos(ret, done);
          } else if (ret && typeof ret.then === "function") {
            ret.then(resolve, reject);
          } else {
            resolve();
          }
        });
      },
      writable: true,
      configurable: true
    }
  });

  return Task;
})();

module.exports = {
  /**
   * Run phases
   * @return {Promise}
   */
  boot: function boot() {
    const emit = this.emit.bind(this) || noop;
    let phases = this._phases;

    emit("before:boot");

    let p = Utils.eachAsync(phases, function (task, next) {
      emit("before:run", task);
      debug("run phase: %s", task.options.name || "unnamed");

      task.run().then(function () {
        next();
      }, next);
    });
    // Return a bluebird promise.
    return Promise.resolve(p).then(function () {
      emit("boot");
    });
  },
  /**
   * Add new phase the the runner
   * @param {String} [name]
   * @param {Function} fn
   * @param {Object} [context]
   * @return {Task}
   */
  phase: function phase(name, fn, context) {
    this._phases = this._phases || [];

    if (!fn) {
      fn = name;
      name = null;
    }

    if (typeof fn !== "function") {
      throw new Error("fn not a function or is not a function");
    }

    debug("adding phase: %s", name || "unnamed");

    var t = new Task({
      name: name,
      fn: fn,
      context: context || this
    });

    this._phases.push(t);

    return t;
  }
};