'use strict';
/**
 * Dependencies
 */

var debug = require('debug')('koa-router'),
  methods = require('methods'),
  Route = require('./route'),
  compose = require('koa-compose'),
  mount = require('koa-mount'),
  utils = require('../utils'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter;

/**
 * Expose `Router`
 */

module.exports = Router;

util.inherits(Router, EventEmitter)
/**
 * Initialize Router.
 *
 * @param {Application=} app Optional. Extends app with methods such
 * as `app.get()`, `app.post()`, etc.
 * @param {Object=} opts Optional. Passed to `path-to-regexp`.
 * @return {Router}
 * @api public
 */

function Router(app, opts) {

  if (!(this instanceof Router)) {
    var router = new Router(app, opts);
    return router.middleware();
  }

  EventEmitter.call(this);

  this._ns = [];
  if (app && !app.use) {
    opts = app;
    app = null;
  }
  this.app = app;

  this.opts = opts || {};
  this.methods = ['OPTIONS'];
  this.routes = [];
  this.params = {};

  // extend application
  //if (app) this.extendApp(app);
}

/**
 * Router prototype
 */

var router = Router.prototype;

/**
 * Router middleware factory. Returns router middleware which dispatches route
 * middleware corresponding to the request.
 *
 * @param {Function} next
 * @return {Function}
 * @api public
 */
router.middleware = function() {
  var router = this;

  return function*(next) {
    var routes = router.routes,
        i = routes.length;

    if (!(this.params instanceof Array)) {
      this.params = [];
    }


    var prev = next || function*(err) { };
    var route;
    while (i--) {
      route = routes[i];
      if (route instanceof Route) {
        var pathname = router.opts.routerPath || this.routerPath || this.path;
        var params = route.match(pathname);
        if (params && ~route.methods.indexOf(this.method)) {
          debug('%s %s', this.method, pathname);
          this.route = route;
          merge(this.params, params);
          prev = yield *route.middleware.call(this, prev);
        } else {
          yield *prev;
        }

      } else {
        prev = route.call(this, prev);
      }

    }

    yield *prev;
  };
};

/**
 * Create `router.verb()` methods, where *verb* is one of the HTTP verbes such
 * as `router.get()` or `router.post()`.
 */

methods.forEach(function(method) {
  router[method] = function(name, path, middleware) {
    var args = Array.prototype.slice.call(arguments);
    if ((typeof path === 'string') || (path instanceof RegExp)) {
      args.splice(2, 0, [method]);
    } else {
      args.splice(1, 0, [method]);
    }
    this.register.apply(this, args);
    return this;
  };
});

// Alias for `router.delete()` because delete is a reserved word
router.del = router['delete'];

/**
 * Register route with all methods.
 *
 * @param {String} name Optional.
 * @param {String|RegExp} path
 * @param {Function} middleware You may also pass multiple middleware.
 * @return {Route}
 * @api public
 */

router.all = function(name, path, middleware) {
  var args = Array.prototype.slice.call(arguments);
  args.splice(typeof path == 'function' ? 1 : 2, 0, methods);

  this.register.apply(this, args);
  return this;
};

/**
 * Redirect `path` to `destination` URL with optional 30x status `code`.
 *
 * @param {String} source URL, RegExp, or route name.
 * @param {String} destination URL or route name.
 * @param {Number} code HTTP status code (default: 301).
 * @return {Route}
 * @api public
 */

router.redirect = function(source, destination, code) {
  // lookup source route by name
  if (source instanceof RegExp || source[0] != '/') {
    source = this.url(source);
  }

  // lookup destination route by name
  if (destination instanceof RegExp || destination[0] != '/') {
    destination = this.url(destination);
  }

  return this.all(source, function*() {
    this.redirect(destination);
    this.status = code || 301;
  });
};

/**
 * Create and register a route.
 *
 * @param {String} name Optional.
 * @param {String|RegExp} path Path string or regular expression.
 * @param {Array} methods Array of HTTP verbs.
 * @param {Function} middleware Multiple middleware also accepted.
 * @return {Route}
 * @api public
 */
router.register = function(name, path, methods, middleware) {
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
  Object.keys(this.params).forEach(function(param) {
    route.param(param, this.params[param]);
  }, this);

  // register route with router
  // DEBUG: this.routes.push(route);

  // register route methods with router (for 501 responses)
  route.methods.forEach(function(method) {
    if (!~this.methods.indexOf(method)) {
      this.methods.push(method);
    }
  }, this);

  var router = this;
  router._cache = router._cache || {};

  this.emit('route:register', {
    router: this,
    route: route
  });

  var fn = function*(next) {

    if (!(this.params instanceof Array)) {
      this.params = [];
    }

    var pathname = router.opts.routerPath || this.routerPath || this.path;
    var params = route.match(pathname);
    if (params && ~route.methods.indexOf(this.method)) {
      debug('%s %s', this.method, pathname);
      this.route = route;
      merge(this.params, params);
      yield *route.middleware.call(this, next);
    } else {
      yield *next;
    }
  };

  //this.use(fn);
  this.use(route);

  return route;
};

router.unregister = function (path, methods) {
  if (methods && !Array.isArray(methods))
    methods = [methods];

  var routes = this.routes, route,i;

  for (i = 0; i < routes.length; i++ ) {
    route = routes[i];
    if ( route.path !== path)
      continue;

    if (methods) {
      for (var x=0;x<methods.length;x++) {
        var met = methods[x];
        var index = route.methods.indexOf(met);
        if (index > -1) {
          route.methods.splice(index,1);
        }
      }
    } else {
      var index = this._routes.indexOf(route);
      this.emit('route:unregister', {
        router: this,
        route: route,
      });

      this._routes = this._routes.splice(index,1);
    }
  }

};

router.unregisterAll = function () {
  this.routes.forEach(function (route) {
    this.emit('route:unregister', {
      router: this,
      route: route
    });
  }, this);
}


router.use = function(middleware) {
  if (arguments.length > 1) {
    middleware = Array.prototype.slice.call(arguments, 0);
  }

  if (Array.isArray(middleware)) {
    middleware = compose(middleware);
  }

  this.routes.push(middleware);


};
/**
 * Lookup route with given `name`.
 *
 * @param {String} name
 * @return {Route|false}
 * @api public
 */

router.route = function(name) {
  for (var len = this.routes.length, i = 0; i < len; i++) {
    if (this.routes[i].name == name) {
      return this.routes[i];
    }
  }

  return false;
};

/**
 * Generate URL for route using given `params`.
 *
 * @param {String} name route name
 * @param {Object} params url parameters
 * @return {String|Error}
 * @api public
 */

router.url = function(name, params) {
  var route = this.route(name);

  if (route) {
    var args = Array.prototype.slice.call(arguments, 1);
    return route.url.apply(route, args);
  }

  return new Error("No route found for name: " + name);
};


router.param = function(param, fn) {
  this.params[param] = fn;
  this.routes.forEach(function(route) {
    route.param(param, fn);
  });
  return this;
};

/**
 * Extend given `app` with router methods.
 *
 * @param {Application} app
 * @return {Application}
 * @api private
 */

router.extendApp = function(app) {
  var router = this;

  app.url = router.url.bind(router);
  app.router = router;

  ['all', 'redirect', 'register', 'del', 'param']
  .concat(methods)
    .forEach(function(method) {
      app[method] = function() {
        router[method].apply(router, arguments);
        return this;
      };
    });

  return app;
};

/**
 * Merge b into a.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

function merge(a, b) {
  if (!b) return a;
  for (var k in b) a[k] = b[k];
  return a;
}
