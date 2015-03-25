"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var dbg = _interopRequire(require("debug"));

var methods = _interopRequire(require("methods"));

var Route = _interopRequire(require("./route"));

var compose = _interopRequire(require("koa-compose"));

var assign = _interopRequire(require("object-assign"));

var EventEmitter = require("events").EventEmitter;

let debug = dbg("koa-router");

function* noop() {}

let Router = (function (EventEmitter) {
  /**
   * Router
   * @param {Router} [parent]
   * @param {Object} options
   * @param {String} [options.rootPath]
   * @extends EventEmitter
   */

  function Router(parent) {
    let options = arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Router);

    if (arguments.length === 2) {
      this.parent = parent;
    } else if (parent instanceof Router) {
      this.parent = parent;
    } else {
      options = parent || {};
    }

    _get(Object.getPrototypeOf(Router.prototype), "constructor", this).call(this);

    // Namespaces
    this._ns = [];

    this.opts = options;
    this.methods = ["OPTIONS"];

    this.routes = [];
    this.params = {};

    this.rootPath = options.rootPath || "/";
  }

  _inherits(Router, EventEmitter);

  _prototypeProperties(Router, null, {
    middleware: {
      value: function middleware() {

        const router = this;

        return function* (next) {
          let routes = router.routes,
              i = routes.length;

          if (!(this.params instanceof Array)) {
            this.params = [];
          }

          let prev = next || noop,
              route,
              params;

          let pathname = this.path;

          let pn = router.qualifiedPath === "/" ? pathname : pathname.replace(router.qualifiedPath, "");

          while (i--) {
            route = routes[i];

            if (route instanceof Route) {

              params = route.match(pn);

              if (params && ~route.methods.indexOf(this.method)) {

                debug("%s %s", this.method, pathname);

                this.route = route;
                merge(this.params, params);

                prev = route.middleware.call(this, prev);
              }
            } else if (route instanceof Router) {
              if (route._match(pn)) {
                debug("router: %s".pathname);
                prev = route.middleware().call(this, prev);
              }
            } else {
              prev = route.call(this, prev);
            }
          }

          yield* prev;
        };
      },
      writable: true,
      configurable: true
    },
    all: {

      /**
       * Register route with all methods.
       *
       * @param {String} name Optional.
       * @param {String|RegExp} path
       * @param {Function} middleware You may also pass multiple middleware.
       * @return {Route}
       * @api public
       */

      value: function all(name, path, middleware) {
        var args = Array.prototype.slice.call(arguments);
        args.splice(typeof path == "function" ? 1 : 2, 0, methods);
        this.register.apply(this, args);
        return this;
      },
      writable: true,
      configurable: true
    },
    redirect: {

      /**
       * Redirect `path` to `destination` URL with optional 30x status `code`.
       *
       * @param {String} source URL, RegExp, or route name.
       * @param {String} destination URL or route name.
       * @param {Number} code HTTP status code (default: 301).
       * @return {Route}
       * @api public
       */

      value: function redirect(source, destination, code) {
        // lookup source route by name
        if (source instanceof RegExp || source[0] != "/") {
          source = this.url(source);
        }

        // lookup destination route by name
        if (destination instanceof RegExp || destination[0] != "/") {
          destination = this.url(destination);
        }

        return this.all(source, function* () {
          this.redirect(destination);
          this.status = code || 301;
        });
      },
      writable: true,
      configurable: true
    },
    register: {

      /**
       * Create and register a route.
       *
       * @param {String} name Optional.
       * @param {String|RegExp} path Path string or regular expression.
       * @param {Array} methods Array of HTTP verbs.
       * @param {Function|Array<Function>} middleware Multiple middleware also accepted.
       * @return {Route}
       * @api public
       */

      value: function register(name, path, methods, middleware) {

        if (path instanceof Array) {
          middleware = Array.prototype.slice.call(arguments, 2);
          methods = path;
          path = name;
          name = null;
        } else {
          middleware = Array.prototype.slice.call(arguments, 3);
        }

        // create route
        var route = new Route(path, methods, middleware, name, this.opts);

        // add parameter middleware
        Object.keys(this.params).forEach(function (param) {
          route.param(param, this.params[param]);
        }, this);

        // register route with router
        // DEBUG: this.routes.push(route);

        // register route methods with router (for 501 responses)
        route.methods.forEach(function (method) {
          if (! ~this.methods.indexOf(method)) {
            this.methods.push(method);
          }
        }, this);

        var router = this;
        router._cache = router._cache || {};

        this.emit("route:register", {
          router: this,
          route: route
        });

        this.use(route);

        return route;
      },
      writable: true,
      configurable: true
    },
    unregister: {
      value: function unregister(path, methods) {
        if (methods && !Array.isArray(methods)) methods = [methods];

        var routes = this.routes,
            route,
            i;

        for (i = 0; i < routes.length; i++) {
          route = routes[i];
          if (route.path !== path) continue;

          if (methods) {
            for (var x = 0; x < methods.length; x++) {
              let met = methods[x];
              let index = route.methods.indexOf(met);
              if (index > -1) {
                route.methods.splice(index, 1);
              }
            }
          } else {
            let index = this.routes.indexOf(route);
            this.emit("route:unregister", {
              router: this,
              route: route });

            this._routes = this.routes.splice(index, 1);
          }
        }
      },
      writable: true,
      configurable: true
    },
    use: {
      value: function use() {
        for (var _len = arguments.length, middleware = Array(_len), _key = 0; _key < _len; _key++) {
          middleware[_key] = arguments[_key];
        }

        if (middleware.length > 1) {
          middleware = compose(middleware);
        } else {
          var _ref = middleware;

          var _ref2 = _slicedToArray(_ref, 1);

          middleware = _ref2[0];
        }
        this.routes.push(middleware);

        return this;
      },
      writable: true,
      configurable: true
    },
    namespace: {
      value: function namespace(path, fn) {
        let ns;

        if (this._ns[path]) {
          ns = this._ns[path];
        } else {
          let o = assign({}, this.opts, { rootPath: path });
          ns = new Router(this, o);
          this.use(ns);
        }

        if (typeof fn === "function") {
          fn.call(ns);
        }

        return ns;
      },
      writable: true,
      configurable: true
    },
    route: {
      /**
       * Lookup route with given `name`.
       *
       * @param {String} name
       * @return {Route|false}
       * @api public
       */

      value: function route(name) {
        for (var len = this.routes.length, i = 0; i < len; i++) {
          if (this.routes[i].name == name) {
            return this.routes[i];
          }
        }
        return false;
      },
      writable: true,
      configurable: true
    },
    url: {

      /**
       * Generate URL for route using given `params`.
       *
       * @param {String} name route name
       * @param {Object} params url parameters
       * @return {String|Error}
       * @api public
       */

      value: function url(name) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var route = this.route(name);

        if (route) {
          return route.url.apply(route, args);
        }

        return new Error("No route found for name: " + name);
      },
      writable: true,
      configurable: true
    },
    param: {
      value: (function (_param) {
        var _paramWrapper = function param() {
          return _param.apply(this, arguments);
        };

        _paramWrapper.toString = function () {
          return _param.toString();
        };

        return _paramWrapper;
      })(function (param, fn) {
        this.params[param] = fn;
        this.routes.forEach(function (route) {
          route.param(param, fn);
        });
        return this;
      }),
      writable: true,
      configurable: true
    },
    _match: {
      value: function _match(path) {
        return this._regexp.test(path);
      },
      writable: true,
      configurable: true
    },
    rootPath: {
      get: function () {
        return this._rootPath;
      },
      set: function (path) {

        if (path == null) {
          throw new Error("Cannot set path of null");
        }

        if (path.substr(0, 1) !== "/") {
          path = "/" + path;
        }

        this._rootPath = path;
        this._regexp = new RegExp("^\\" + this.qualifiedPath + ".*");
      },
      configurable: true
    },
    qualifiedPath: {
      get: function () {
        if (this.parent) {
          let qp = this.parent.qualifiedPath;
          if (qp === "/") qp = "";
          return qp + this.rootPath;
        }
        return this.rootPath;
      },
      configurable: true
    }
  });

  return Router;
})(EventEmitter);

module.exports = Router;

/**
 * Create `router.verb()` methods, where *verb* is one of the HTTP verbes such
 * as `router.get()` or `router.post()`.
 */

methods.forEach(function (method) {
  Router.prototype[method] = function (name, path, middleware) {
    let args = Array.prototype.slice.call(arguments);
    if (typeof path === "string" || path instanceof RegExp) {
      args.splice(2, 0, [method]);
    } else {
      args.splice(1, 0, [method]);
    }
    this.register.apply(this, args);
    return this;
  };
});

/**
 * Merge b into a.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

function merge(a, b) {
  if (!b) {
    return a;
  }for (var k in b) a[k] = b[k];
  return a;
}