
'use strict';

var bootable = require('./bootable'),
    Router = require('./router'),
    Koa = require('koa'),
    util = require('util'),
    compose = require('koa-compose'),
    utils = require('./utils'),
    fs = require('fs'),
    context = require('./context');

exports = module.exports = Application;

Application.defaults = {
  controllers: './controllers',
  routes: './routes',
  initializers: './initializers'
};

Application.Promise = Promise;
Application.Router = Router;

function Application (options) {
  options = options || {};
  if (!(this instanceof Application)) return new Application(options);

  Koa.call(this);
  this.context = Object.create(context);

  this.settings = utils.extend({},Application.defaults, options);

  this.router = new Router(this,{
    controllerPath: this.settings.controllers
  });

  this.router.extendApp(this);


  this.__logger = null;
  Object.defineProperty(this, 'logger', {
    get: function () { return this.__logger; },
    set: function (logger) {
      this.__logger = logger;
      this.context.logger = logger;
    }
  });

  this.logger = options.logger || require('./logger');
}

util.inherits(Application, Koa);

var application = Application.prototype;

utils.extend(application, bootable);

// Default boot phases.
application.default = function () {
  var initializer = require('./booters/initializers');

  if (fs.existsSync(this.settings.initializers)) {
      this.phase('initializers', initializer(this.settings.initializers));
  } else {
    this.logger.warn('initializers path "%s" does not exists',this.settings.initializers);
  }

  if (fs.existsSync(this.settings.routes)) {
    this.phase('routes', initializer(this.settings.routes, this.router));
  } else {
    this.logger.warn('routes path "%s" does not exists',this.settings.routes)
  }



  return this;
};

/**
 * Use middlewares
 * @param  {[*function]} middleware One or more middleware functions
 * @return {JaffaMVC}            This for chaining.
 */
application.use = function (middleware) {
  if (arguments.length > 1) {
    var args = Array.prototype.slice.call(arguments, 0);
    middleware = compose(args);
  }

  Koa.prototype.use.call(this, middleware);
  return this;
};


/**
 * Start app
 * @param  {Function} fn        Optional
 * @return {Promise|null}
 */
application.start = function (fn) {
  if (this.__initialized)
    return;

  this.emit('before:start');

  return this.boot().bind(this).then(function () {
    this.__initialized = true;
    this.use(this.router.middleware());
    this.emit('start');
  }).nodeify(fn);
};

application.listen = function (port, force) {
  if (!this.__initialized && !force)
    throw new Error('application not initialized, you should called start!');

  return Koa.prototype.listen.call(this, port);
};
