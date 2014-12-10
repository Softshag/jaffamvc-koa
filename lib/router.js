'use strict';

var KoaRouter = require('koa-router'),
  compose = require('koa-compose'),
  mount = require('koa-mount'),
  utils = require('./utils'),
  debug = require('debug')('mvc:router'),
  _ = require('lodash'),
  util = require('util');

exports = module.exports = Router;

function Router(options) {
  this.opt = options || {};
  this._ns = {};
  KoaRouter.prototype.constructor.call(this, options);
  router = new KoaRouter(options);
  router.extendApp(this);
}

util.inherits(Router, KoaRouter);

var router = Router.prototype;

router.middleware = function () {
  //return this.router.middleware();
  var router = this;

  return function *_dispatch (next) {

    var routes = router.routes;

    var len = routes.length;

    // Parameters for this route
    if (!(this.params instanceof Array)) {
      this.params = {};
    }

    var ismatch = false;

    for (var i = 0; i < len; i++) {
      var route = routes[i];

      if (typeof route === 'function') {
        yield *route.call(this, next);

      } else {
        var pathname = router.opts.routerPath || this.routerPath || this.path;
        debug('%s %s', this.method, pathname);

        var params = route.match(pathname);

        if (params && ~route.methods.indexOf(this.method)) {
          ismatch = true;

          this.route = route;
          _.extend(this.params, params);

          debug('match "%s" %s', route.path, route.regexp);
          yield *route.middleware.call(this, next);

        }
      }
    }

    if (!ismatch) {
      debug('no match');
      yield *next;
    }

  };


};

/**
@param {string} path
@param {function...} middlewares
@param {string} controllerAction
@param {object} options
@option options {string} via
*/
router.match = function() {
  var action, controller, controllerAction, method, middlewares, options,
    path, _i, _ref;
  path = arguments[0], middlewares = 4 <= arguments.length ?
    Array.prototype.slice.call(arguments, 1, _i = arguments.length - 2) :
    (_i = 1, []), controllerAction = arguments[_i++], options = arguments[_i++];

  options = options || {};

  if (typeof path !== 'string')
    throw new Error('path must be a string');

  if (typeof options === 'string') {
    middlewares.push(controllerAction);
    controllerAction = options;
    options = {};
  }

  if (typeof controllerAction === 'function') {
    middlewares.push(controllerAction);
    controllerAction = null;
  } else if (typeof controllerAction === 'object') {
    options = controllerAction;
    controllerAction = null;
  }

  if (controllerAction != null) {
    _ref = controllerAction.split('#'), controller = _ref[0], action = _ref[1];
  }

  if (options.controller && options.action) {
    controller = options.controller, action = options.action;
    delete options.action;
    delete options.controller;
  }

  if (!((controller != null) && (action != null))) {
    throw new Error('Controller and action is required!');
  }

  method = options.via || 'get';

  this.register(path,[method], dispatch.call(this, controller, action, middlewares, options));

};

/**
 * [namespace description]
 * @param  {[type]}   namespace [description]
 * @param  {Function | [Function]} fn        [description]
 * @return {[type]}             [description]
 */
router.namespace = function (namespace, fn) {
  var middleware = [];
  if (arguments.length > 2) {
    middleware = Array.prototype.slice.call(arguments, 1);
    fn = middleware.pop();
  }

  var ns = null;
  if (_.has(this._ns,namespace))
    ns = this._ns[namespace];
  else {
    ns = new Router(this.opt);
    middleware.push(ns.middleware());
    this.use(mount(namespace,compose(middleware)));
  }


  fn.call(ns);

  return ns;
};

router.use = function (middleware) {
  if (arguments.length > 1) {
    middleware = Array.prototype.slice.call(arguments, 0);
  }

  if (_.isArray(middleware)) {
    middleware = compose(middleware);
  }
  this.routes.push(middleware);

};

router.resource = function() {

};

router.resources = function() {

};

function dispatch(name, action, middlewares, options) {

  var path = this.opt.controllerPath;
  var file = utils.resolveFile(path, name);

  if (!file)
    throw new Error('could not find controller : ' + name +
      'at path ' + path);

  var Controller = require(file);

  var middleware = function *(next) {
    var controller = null;
    if (typeof Controller === 'function') {
      controller = new Controller(options);
    } else {
      controller = Object.create(Controller);
    }

    if (controller && typeof controller[action] === 'function') {
      debug('dispatch ' + name + "#" + action);
      return yield *controller[action].call(this, next);
    } else {
      return yield *next;
    }

  };

  middlewares.push(middleware);

  return compose(middlewares);
}
