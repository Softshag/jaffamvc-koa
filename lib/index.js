
'use strict';

var bootable = require('./bootable'),
    Router = require('./router'),
    Koa = require('koa'),
    util = require('util'),
    compose = require('koa-compose'),
    utils = require('./utils');

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

application.default = function () {
  var initializer = require('./booters/initializers');

  this.phase('initializers', initializer(this.settings.initializers));
  this.phase('routes', initializer(this.settings.routes, this.router));
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


/*application.set = function (key, value) {
  this.settings[key] = value;
};

application.get = function (key) {
  if (arguments.length > 1)
  return this.settings[key];
};*/

application.start = function (fn) {
  if (this.__initialized)
    return;
    
  return this.boot().bind(this).then(function () {
    this.__initialized = true;
    this.use(this.router.middleware());
  }).nodeify(fn);
};

application.listen = function (port, force) {
  if (!this.__initialized && !force)
    throw new Error('application not initialized, you should called start!');

  return Koa.prototype.listen.call(this, port);
};
