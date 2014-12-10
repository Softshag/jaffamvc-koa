
'use strict';

var bootable = require('./bootable'),
    Router = require('./router/router'),
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


function Application (options) {
  if (!(this instanceof Application)) return new Application(options);

  Koa.call(this);

  this.settings = utils.extend({},Application.defaults, options);

  new Router(this);
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

application.use = function (middleware) {
  if (arguments.length > 1) {
    var args = Array.prototype.slice.call(arguments, 0);
    middleware = compose(args);
  }

  Koa.prototype.use.call(this, middleware);
};

application.start = function (fn) {
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
