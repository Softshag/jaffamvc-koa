
'use strict';

import KoaRouter from './router/router';
import dbg from 'debug';
import compose from 'koa-compose';
import assign from 'object-assign';
import mount from 'koa-mount';
import methods from 'methods';
import DispatchError from './errors/dispatch-error';
import * as utils from './utils';
import Path from 'path';


let debug = dbg('mvc:router');

let _slice = Array.prototype.slice;

function _filter (array, props) {
  let out = [];
  for (var i=0;i<array.length;i++) {
    let p = array[i];
    if (!~props.indexOf(p)) out.push(p);
  }
  return out;
}


export default class Router extends KoaRouter {

  constructor(app, options={}) {

    if (!options.rootPath) {
      throw new Error('You should defined root url for router');
    }

    this.rootPath = options.rootPath;

    super(app, options);
  }
  /**
   * Match a route to a controller action
   * @param {String} path
   * @param {...Function} [middleware]
   * @param {String} match
   * @param {Object} [options]
   * @param {String|Object} options.controller
   * @param {String} options.action
   *
   * @example
   *   router.match('/', 'home#index');
   *   router.match('/',fn,fn,'home#index');
   *   router.match('/', {controller:'home',action:'index'});
   *   router.match('/',fn, {controller:'home',action:'index'});
   *
   */
  match () {
    let controller, action;
    let i = 0;
    let path = arguments[0];
    let middlewares = 4 <= arguments.length ? _slice.call(arguments, 1, i = arguments.length - 2) :
      (i = 1, []);
    let controllerAction = arguments[i++];
    let options = arguments[i++];

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
      [controller,action] = controllerAction.split('#');
    }

    if (options.controller && options.action) {
      controller = options.controller, action = options.action;
      delete options.action;
      delete options.controller;
    }

    if (!((controller != null) && (action != null))) {
      throw new Error('Controller and action is required!');
    }

    let method = options.via || 'get';
    debug('match: %s %s %s#%s',method.toUpperCase(),path,controller,action);

    this.emit('register:match',{
      name: path,
      method: [method],
      controller: controller,
      action: action,
      options: options
    });

    return this.register(path, [method], dispatch.call(this, controller, action,
      middlewares, options));

  }

  /**
   * Add a namespace
   */
  namespace(path, ...middleware) {
    let fn = middleware.pop();

    let options = assign({},this.opts);
    options.rootPath = Path.join(this.rootPath, path);

    let ns = new Router(this.app, this.opts);

    middleware.push(ns.middleware());

    if (middleware.length > 1) {
      middleware = compose(middleware);
    } else {
      [middleware] = middleware;
    }

    this.use(mount(path, middleware));

    this.emit('register:namespace', this, ns);

    fn.call(ns, ns);

    return ns;
  }

  resources(name, middlewares, options) {
    let _i, actions, controller, param;
    name = arguments[0], middlewares = 3 <= arguments.length ?
      _slice.call(arguments, 1, _i = arguments.length - 1) :
      (_i = 1, []), options = arguments[_i++];

    options = options || {};
    name = options.as || name;

    actions = ['index', 'new', 'create', 'show', 'edit', 'update', 'patch', 'destroy'];

    if (options.only) {
      actions = options.only;
    } else if (options.except) {
      actions = _filter(actions, options.except);
    }

    controller = options.controller || name;
    param = ':id';

    if (options.param) param = options.param;

    debug('defining resource: %s',name);

    for (var i = 0; i < actions.length; i++) {
      /*jshint loopfunc:true*/
      let o = null, action = actions[i];
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

      let opt = assign({}, options, {
        controller: controller,
        action: action,
        via: o.m
      });
      let args = [o.p].concat(middlewares);
      args.push(opt);

      this.match.apply(this, args);
    }
    this.emit('register:resources',{
      name: name,
      options: options
    });
  }
}


function dispatch(name, action, middlewares, options) {
  /*jshint validthis:true */
  let path = this.opts.controllerPath,
      Controller = null;

  if (!path)
    throw new DispatchError('Controller path is not defined!');

  if (typeof name === 'string') {
    let file = utils.resolveFile(path, name);

    if (!file)
      throw new DispatchError('could not find controller : ' + name +
      'at path ' + path);

    Controller = require(file);
  } else {
    Controller = name;
  }

  var middleware = function *(next) {

    let controller = Object.create(this);
    assign(controller, Controller);

    if (typeof controller.initialize === 'function')

      if (utils.isYieldable(controller.initialize)) {
        yield *controller.initialize.call(this, options);
      } else {
        controller.initialize.call(this, options);
      }

    if (controller && typeof controller[action] === 'function') {
      debug('dispatch %s#%s ', name, action);
      return yield *controller[action].call(controller, next);

    } else {
      debug('controller: "%" does not have an action named: %s',name, action);
      this.throw(404);
    }

  };

  middlewares.push(middleware);

  return compose(middlewares);

}
