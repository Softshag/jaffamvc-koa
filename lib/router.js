
'use strict';

var KoaRouterExt = require('./router/router'),
    util = require('util'),
    utils = require('./utils'),
    debug = require('debug')('mvc-router'),
    compose = require('koa-compose'),
    assign = require('object-assign'),
    mount = require('koa-mount'),
    DispatchError = require('./errors/dispatch-error');

var _slice = Array.prototype.slice;


module.exports = Router;

function Router (app, options) {
  KoaRouterExt.call(this, app, options);
}

util.inherits(Router, KoaRouterExt);

var router = Router.prototype;


/**
* [namespace description]
* @param  {[type]}   namespace          [description]
* @param  {Function | [Function]} fn    [description]
* @return {[type]}                      [description]
*/
router.namespace = function(namespace, fn) {
  var middleware = [];
  if (arguments.length > 2) {
    middleware = Array.prototype.slice.call(arguments, 1);
    fn = middleware.pop();
  }

  var ns = null;
  ns = new Router(this.app, this.opts);
  middleware.push(ns.middleware());

  if (middleware.length > 1)
    middleware = compose(middleware);
  else
    middleware = middleware[0];

  this.use(mount(namespace, middleware));
  fn.call(ns);

  return ns;
};


router.match = function() {
  var action, controller, controllerAction, method, middlewares, options,
  path, _i, _ref;
  path = arguments[0], middlewares = 4 <= arguments.length ?
  _slice.call(arguments, 1, _i = arguments.length - 2) :
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
  debug('match: %s %s %s#%s',method.toUpperCase(),path,controller,action);
  this.register(path, [method], dispatch.call(this, controller, action,
    middlewares, options));

};

router.resources = function (name, middlewares, options) {
  var _i, actions, controller, param;
  name = arguments[0], middlewares = 3 <= arguments.length ?
  _slice.call(arguments, 1, _i = arguments.length - 1) :
    (_i = 1, []), options = arguments[_i++];

  options = options || {};
  name = options.as || name;

  actions = ['index', 'new', 'create', 'show', 'edit', 'update', 'patch', 'destroy'];

  controller = options.controller || name;
  param = ':id';

  if (options.param) param = options.param;

  debug('defining resource: %s',name);

  for (var i = 0; i < actions.length; i++) {
    var o = null, action = actions[i];
    o = (function () {
      switch (action) {
        case 'index': return {p:name+'.:format?',m:'get'};
        case 'show': return {p:name+'/'+param+'.:format?',m:'get'};
        case 'create': return {p:name, m:'post'};
        case 'update': return {p:name+'/'+param, m: 'put'};
        case 'patch': return {p:name+'/'+param,m:'patch'};
        case 'destroy': return {p:name+'/'+param,m:'delete'};
      }
    })();

    if (!o) {
      debug('-- skipping action: %s',action);
      continue;
    }
    debug('-- action: %s %s (%s)', o.m.toUpperCase(), o.p, action);

    var opt = utils.extend({}, options, {
      controller: controller,
      action: action,
      via: o.m
    });
    var args = [o.p].concat(middlewares);
    args.push(opt);

    this.match.apply(this, args);
  }

};


function dispatch(name, action, middlewares, options) {

  var path = this.opts.controllerPath,
      Controller = null;

  if (!path)
    throw new DispatchError('Controller path is not defined!');

  if (typeof name === 'string') {
    var file = utils.resolveFile(path, name);

    if (!file)
      throw new DispatchError('could not find controller : ' + name +
      'at path ' + path);

    Controller = require(file);
  } else {
    Controller = name;
  }

  var middleware = function *(next) {
    var controller = null;
    if (typeof Controller === 'function') {
      controller = new Controller(options);
    } else {
      controller = Object.create(this, this.prototype);
    }

    assign(controller, this, Controller);

    if (typeof controller.initialize === 'function')
      controller.initialize.call(this, options);

    if (controller && typeof controller[action] === 'function') {
      debug('dispatch %s#%s ', name, action);
      return yield *controller[action].call(controller, next);
    } else {
      debug('controller did not have a %s action',action);
      this.throw(404);
      //return yield *next;
    }

  };

  middlewares.push(middleware);

  return compose(middlewares);

}
