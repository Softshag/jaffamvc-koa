"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var bootable = _interopRequire(require("./bootable"));

var Router = _interopRequire(require("./router"));

var RouterExt = _interopRequire(require("./router-ext"));

var Mediator = _interopRequire(require("./mediator"));

var utils = _interopRequireWildcard(require("./utils"));

var context = _interopRequire(require("./context"));

var Koa = _interopRequire(require("koa"));

var compose = _interopRequire(require("koa-compose"));

var assign = _interopRequire(require("object-assign"));

var fs = _interopRequire(require("mz/fs"));

var co = _interopRequire(require("co"));

assign(Router.prototype, RouterExt);

/**
 * JaffaMVC class
 * @class  JaffaMVC
 */

let JaffaMVC = (function (Koa) {

  /**
   * constructor
   * @constructs JaffaMVC
   * @param  {Object}
   * @return {[type]}
   */

  function JaffaMVC() {
    let options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, JaffaMVC);

    if (!(this instanceof JaffaMVC)) {
      return new JaffaMVC(options);
    }

    _get(Object.getPrototypeOf(JaffaMVC.prototype), "constructor", this).call(this);

    this.__logger = null;
    this.__channel = null;

    this.context = Object.create(context);

    this.settings = assign({}, JaffaMVC.defaults, options);

    Router.extendApp(this, {
      controllerPath: this.settings.controllers,
      rootPath: options.rootPath || "/"
    });

    this.logger = options.logger || require("./logger");
    this.channel = new Mediator();
  }

  _inherits(JaffaMVC, Koa);

  _prototypeProperties(JaffaMVC, null, {
    logger: {
      get: function () {
        return this._logger;
      },
      set: function (logger) {
        this._logger = logger;
        this.context.logger = logger;
      },
      configurable: true
    },
    channel: {
      get: function () {
        return this._channel;
      },
      set: function (chan) {
        this._channel = chan;
        this.context.channel = chan;
      },
      configurable: true
    },
    use: {
      /**
       * Use middlewares
       * @param  {[*function]} middleware One or more middleware functions
       * @return {JaffaMVC}            This for chaining.
       */

      value: function use() {
        for (var _len = arguments.length, middleware = Array(_len), _key = 0; _key < _len; _key++) {
          middleware[_key] = arguments[_key];
        }

        if (middleware.length == 1) {
          var _ref = middleware;

          var _ref2 = _slicedToArray(_ref, 1);

          middleware = _ref2[0];
        } else {
          middleware = compose(middleware);
        }

        _get(Object.getPrototypeOf(JaffaMVC.prototype), "use", this).call(this, middleware);

        return this;
      },
      writable: true,
      configurable: true
    },
    start: {
      /**
       * Start app
       * @param  {Function} fn        Optional
       * @return {Promise|null}
       */

      value: function start(port) {
        if (this.__initialized) {
          return Promise.resolve(this);
        }return co((function* () {
          yield defaultBoot.call(this);

          this.emit("before:start");

          yield this.boot();

          this.__initialized = true;

          this.use(this.router.middleware());

          this.emit("start");

          if (port) {
            this.listen(port);
          }

          return this;
        }).bind(this));
      },
      writable: true,
      configurable: true
    },
    listen: {
      value: function listen(port) {
        let force = arguments[1] === undefined ? false : arguments[1];

        if (!this.__initialized && !force) throw new Error("application not initialized, you should called start!");

        this.emit("listen");

        return _get(Object.getPrototypeOf(JaffaMVC.prototype), "listen", this).call(this, port);
      },
      writable: true,
      configurable: true
    }
  });

  return JaffaMVC;
})(Koa);

module.exports = JaffaMVC;

JaffaMVC.defaults = {
  controllers: "./controllers",
  routes: "./routes",
  initializers: "./initializers"
};

JaffaMVC.Router = Router;
JaffaMVC.Mediator = Mediator;
JaffaMVC.utils = utils;

assign(JaffaMVC.prototype, bootable);

// Default boot phases.
function* defaultBoot() {
  /*jshint validthis:true */

  let initializer = require("./booters/initializers");

  if (yield fs.exists(this.settings.initializers)) {
    this.phase("initializers", initializer(this.settings.initializers));
  } else {
    this.logger.warn("initializers path \"%s\" does not exists", this.settings.initializers);
  }

  if (yield fs.exists(this.settings.routes)) {
    this.phase("routes", initializer(this.settings.routes, this));
  } else {
    this.logger.warn("routes path \"%s\" does not exists", this.settings.routes);
  }
}
/* global JaffaMVC*/