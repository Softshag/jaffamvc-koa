/* global JaffaMVC*/
'use strict';

import bootable from './bootable';
import Router from './router';
import RouterExt from './router-ext';
import Mediator from './mediator';
import * as utils from './utils';
import context from './context';

import Koa from 'koa';
import compose from 'koa-compose';
import assign from 'object-assign';
import fs from 'mz/fs';
import co from './co';


assign(Router.prototype, RouterExt);


export default class JaffaMVC extends Koa {

  /**
   * constructor
   * @constructor JaffaMVC
   * @param  {Object} options
   */
  constructor(options={}) {
    if (!(this instanceof JaffaMVC)) {
      return new JaffaMVC(options);
    }

    super();

    this.context = Object.create(context);
    this.settings = assign({},JaffaMVC.defaults, options);

    /**
     * router
     * @member {Router} router
     */
    this.router = new Router({
      controllerPath: this.settings.controllers,
      rootPath: options.rootPath || '/'
    });

    this.logger = options.logger || require('./logger');
    this.logger.suppressWarnings = options.suppressWarnings;
    this.channel = new Mediator();


  }
  /**
   * Logger
   * @property {Logger} logger
   * @memberOf JaffaMVC#
   */
  get logger() { return this._logger; }
  set logger(logger) {
    this._logger = logger;
    this.context.logger = logger;
  }

  get channel() { return this._channel; }
  set channel(chan) {
    this._channel = chan;
    this.context.channel = chan;
  }

  get server() {
    if (this._server == null) {
      this._server = require('http').createServer(this.callback());
    }
    return this._server;
  }
  /**
   * Use middlewares
   * @param  {...Function} middleware One or more middleware functions
   * @return {JaffaMVC}   This for chaining.
   * @memberOf JaffaMVC#
   * @method use
   */
  use (...middleware) {

    if (middleware.length == 1) {
      [middleware] = middleware;
    } else {
      middleware = compose(middleware);
    }

    super.use(middleware);

    return this;
  }
  /**
   * Start app
   * @method start
   * @memberOf JaffaMVC#
   * @param  {Number} [port] Port to listen on
   * @return {Promise<JaffaMVC>}
   */
  start (port) {
    if (this.__initialized)
      return utils.Promise.resolve(this);


    return co( function *() {
      yield defaultBoot.call(this);

      this.emit('before:start');

      yield this.boot();

      this.__initialized = true;

      this.use(this.router.middleware());

      this.emit('start');

      if (port) {
        this.listen(port);
      }

      return this;

    }.bind(this));

  }

  /**
   * Listen to given port
   * @method listen
   * @memberOf JaffaMVC#
   * @param  {Number}  port  Port to listen on
   * @param  {Boolean} [Force] Force listen if app not started
   * @return {Server}        A nodejs http server
   */
  listen (port, force=false) {
    if (!this.__initialized && !force)
      throw new Error('application not initialized, you should call start!');

    if (!this.__initialized)
      this.logger.warn('listen: application not initialized');

    this.emit('before:listen', port);

    if (this._server) {
      this._server.listen(port);
    } else {
      this._server = super.listen(port);
    }

    this.emit('listen', port);

    return this._server;
  }

  /**
   * Close and stop the application
   * @method close
   * @memberOf JaffaMVC#
   * @return {Promise}
   */
  close () {
    if (this._server) {
      return new utils.Promise(function (resolve, reject) {
        this.emit('before:close');
        this._server.close(function (err) {
          if (err) return reject(err);
          this.emit('close');
          return resolve();
        }.bind(this));
      });
    }

    return utils.Promise.resolve();
  }

}

JaffaMVC.defaults = {
  controllers: './controllers',
  routes: './routes',
  initializers: './initializers',
  suppressWarnings: false
};

JaffaMVC.Router = Router;
JaffaMVC.Mediator = Mediator;
JaffaMVC.utils = utils;

assign(JaffaMVC.prototype, bootable);

// Default boot phases.
function *defaultBoot () {
  /*jshint validthis:true */
  let initializer = require('./booters/initializers');

  if (yield fs.exists(this.settings.initializers)) {
    this.phase('initializers', initializer(this.settings.initializers));
  } else {
    this.logger.warn('initializers path "%s" does not exist',this.settings.initializers);
  }

  if (yield fs.exists(this.settings.routes)) {
    this.phase('routes', initializer(this.settings.routes, this.router, this));
  } else {
    this.logger.warn('routes path "%s" does not exist',this.settings.routes);
  }

}
