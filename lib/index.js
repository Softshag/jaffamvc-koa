
'use strict';

var bootable = require('./bootable'),
    Router = require('./router'),
    Mediator = require('./mediator'),
    Koa = require('koa'),
    util = require('util'),
    compose = require('koa-compose'),
    utils = require('./utils'),
    fs = require('fs'),
    context = require('./context'),
    deprecate = require('depd')('jaffamvc-koa');

exports = module.exports = Application;

JaffaMVC.defaults = {
  controllers: './controllers',
  routes: './routes',
  initializers: './initializers'
};

JaffaMVC.Promise = Promise;
JaffaMVC.Router = Router;
JaffaMVC.Mediator = Mediator;
JaffaMVC.utils = utils;
JaffaMVC.co = require('co');

function JaffaMVC (options) {
  options = options || {};
  if (!(this instanceof JaffaMVC)) return new JaffaMVC(options);

  Koa.call(this);
  this.context = Object.create(context);

  this.settings = utils.extend({},JaffaMVC.defaults, options);

  this.router = new Router(this,{
    controllerPath: this.settings.controllers
  });

  this.router.extendApp(this);


  this.__logger = null;
  this.__channel = null;

  Object.defineProperty(this, 'logger', {
    get: function () { return this.__logger; },
    set: function (logger) {
      this.__logger = logger;
      this.context.logger = logger;
    }
  });

  Object.defineProperty(this, 'channel', {
    get: function () { return this.__channel; },
    set: function (channel) {
      this.__channel = channel;
      this.context.channel = channel;
    }
  });

  this.logger = options.logger || require('./logger');
  this.channel = new Mediator();
}

util.inherits(JaffaMVC, Koa);

var application = JaffaMVC.prototype;

utils.extend(application, bootable);

// Deprecated #default()
application.default = deprecate.function(function defaults () { return this; });


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

  defaultBoot.call(this);

  this.emit('before:start');

  return this.boot().bind(this).then(function () {

    this.__initialized = true;
    this.use(this.router.middleware());
    this.emit('start');
    return this;

  }).nodeify(fn);
};

application.startAndListen = function (port) {
  this.start(function () {
    this.logger.info('Application started and listening on port: %s', port);
    this.listen(port);
  });
}

application.listen = function (port, force) {
  if (!this.__initialized && !force)
    throw new Error('application not initialized, you should called start!');

  return Koa.prototype.listen.call(this, port);
};


// Default boot phases.
function defaultBoot () {
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
}
