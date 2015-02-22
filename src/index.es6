/* global JaffaMVC*/
'use strict';

import bootable from './bootable';
import Router from './router';
import Mediator from './mediator';
import utils from './utils';
import context from './context';

import Koa from 'koa';
import compose from 'koa-compose';
import assign from 'object-assign';
import fs from 'mz/fs';
import co from 'co';

export default class JaffaMVC extends Koa {

  constructor(options={}) {
    if (!(this instanceof JaffaMVC)) {
      return new JaffaMVC(options);
    }

    super();

    this.__logger = null;
    this.__channel = null;

    this.context = Object.create(context);

    this.settings = assign({},JaffaMVC.defaults, options);

    Router.extendApp(this,{
      controllerPath: this.settings.controllers,
      rootPath: options.rootPath || '/'
    });


    this.logger = options.logger || require('./logger');
    this.channel = new Mediator();


  }
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
  /**
   * Use middlewares
   * @param  {[*function]} middleware One or more middleware functions
   * @return {JaffaMVC}            This for chaining.
   */
  use (...middleware) {

    if (middleware.length == 1) {
      [middleware] = middleware;
    } else {
      middleware = compose(middleware);
    }

    super.use(middleware);
    //Koa.prototype.use.call(this, middleware);
    return this;
  }
  /**
   * Start app
   * @param  {Function} fn        Optional
   * @return {Promise|null}
   */
  start (port) {
    if (this.__initialized)
      return Promise.resolve(this);


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

  listen (port, force=false) {
    if (!this.__initialized && !force)
      throw new Error('application not initialized, you should called start!');

    this.emit('listen');

    return super.listen(port);
  }

}

JaffaMVC.defaults = {
  controllers: './controllers',
  routes: './routes',
  initializers: './initializers'
};

JaffaMVC.Promise = require('native-or-bluebird');
JaffaMVC.Router = Router;
JaffaMVC.Mediator = Mediator;
JaffaMVC.utils = utils;
JaffaMVC.co = require('co');

assign(JaffaMVC.prototype, bootable);


// Default boot phases.
function *defaultBoot () {
  /*jshint validthis:true */

  let initializer = require('./booters/initializers');

  if (yield fs.exists(this.settings.initializers)) {
    this.phase('initializers', initializer(this.settings.initializers));
  } else {
    this.logger.warn('initializers path "%s" does not exists',this.settings.initializers);
  }

  if (yield fs.exists(this.settings.routes)) {
    this.phase('routes', initializer(this.settings.routes, this.router));
  } else {
    this.logger.warn('routes path "%s" does not exists',this.settings.routes);
  }

}
