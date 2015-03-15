"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var eos = _interopRequire(require("end-of-stream"));

var dbg = _interopRequire(require("debug"));

var co = _interopRequire(require("co"));

var utils = _interopRequireWildcard(require("./utils"));

var Promise = _interopRequire(require("native-or-bluebird"));

var EventEmitter = require("events").EventEmitter;

var assign = _interopRequire(require("object-assign"));

let debug = dbg("mvc:boot");

let noop = function* noop() {};

let Task = exports.Task = (function () {
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

          const done = function done(err) {
            if (err) {
              return reject(err);
            }resolve();
          };

          var _options = _this3.options;
          let fn = _options.fn;
          let context = _options.context;

          // Node style callback
          if (fn.length === 1) {
            return fn.call(context, done);
            // Generator
          } else if (utils.isGenerator(fn) || utils.isGeneratorFunction(fn)) {
            fn = co.wrap(fn);
          }

          const ret = fn.call(context);

          if (ret && ret instanceof Error) {
            reject(ret);
            // Streams
          } else if (ret && typeof ret.pipe === "function") {
            eos(ret, done);
          } else if (ret && typeof ret.then === "function") {
            ret.then(resolve, reject);
          } else {
            resolve(ret);
          }
        });
      },
      writable: true,
      configurable: true
    }
  });

  return Task;
})();

let bootable = {
  /**
   * Run phases
   * @return {Promise}
   */
  boot: function boot() {

    const emit = this.emit.bind(this) || noop;
    let phases = this._phases;

    emit("before:boot");
    let len = phases.length;

    return co((function* () {
      let task;

      for (var i = 0; i < len; i++) {
        task = phases[i];

        debug("running phase %s", task.options.name);

        emit("before:run", task);
        yield task.run();
        emit("run", task);
      }

      emit("boot");
    }).bind(this));
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
      name = fn.name || "unnamed";
    }

    if (typeof fn !== "function") {
      throw new Error("fn not a function");
    }

    debug("adding phase: %s", name);

    let task = new Task({
      name: name,

      fn: fn,
      context: context || this
    });

    this._phases.push(task);

    return task;
  }
};

exports["default"] = bootable;

let Booter = exports.Booter = (function (EventEmitter) {
  function Booter() {
    _classCallCheck(this, Booter);

    if (EventEmitter != null) {
      EventEmitter.apply(this, arguments);
    }
  }

  _inherits(Booter, EventEmitter);

  return Booter;
})(EventEmitter);

assign(Booter.prototype, bootable);
Object.defineProperty(exports, "__esModule", {
  value: true
});