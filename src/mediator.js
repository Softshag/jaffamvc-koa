
'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    assign = require('object-assign');

module.exports = (function (__super) {

  util.inherits(Mediator, __super);

  /**
   * Mediator
   * @constructor Mediator
   */
  function Mediator (name) {
    this.name = name;
    __super.call(this);
  }


  /**
   * Commands
   * @mixin
   * @memberof JaffaMVC.Channel
   */
  var Commands = {
    /**
     * Comply to a Commands
     * @param  {String}   cmd The name of the Commands
     * @param  {Function} fn  The function to run
     * @param  {Object}   ctx The context of which to run the function
     */
    comply: function (cmd, fn, ctx) {
      this._cmds = this._cmds || {};
      this._cmds[cmd] = {
        fn: fn,
        ctx: ctx || this
      };

    },
    complyTo: function (req) {
        return this._reqs.hasOwnProperty(req);
    },
    /**
     * Execute Commands
     * @param  {String} cmd The name of the Commands
     */
    command: function (cmd, ...args) {
      this._cmds = this._cmds || {};

      if (this._cmds.hasOwnProperty(cmd)) {
        _execute(this._cmds[cmd], args);
      } else {
        throw new Error('Handler not set for command: ' + cmd);
      }
    },
    /**
     * Stop complying to a command
     * @param {String}   cmd The name of the command
     * @param {Function} fn  [description]
     * @param {Object}   ctx [description]
     */
    stopComplying: function (cmd, fn, ctx) {
      this._cmds = this._cmds || {};
      ctx = ctx || this;
      delete this._cmds[cmd];
    }
  };
  /**
   * Requests
   * @mixin
   * @memberof JaffaMVC.Channel
   */
  var Requests = {
    /**
     * Reply to a Request
     * @param  {String}   req The name of the request
     * @param  {Function} fn  replying function
     * @param  {Object}   ctx The context in which the function is called
     */
    reply: function (req, fn, ctx) {
      this._reqs = this._reqs || {};
      this._reqs[req] = {
        fn: fn,
        ctx: ctx || this
      };

    },
    replyTo: function (req) {
        return this._reqs.hasOwnProperty(req);
    },
    /**
     * Request
     * @param  {String} req The name of the request
     */
    request: function (req, ...args) {
      this._reqs = this._reqs || {};

      if (this._reqs.hasOwnProperty(req)) {
        return _execute(this._reqs[req], args);
      } else {
        throw new Error('Handler not set for request: ' + req);
      }
    },
    /**
     * Stop replying to a request
     * @param {String}   req The name of the request
     * @param {Function} fn  The function
     * @param {Object}   ctx the context
     */
    stopReplying: function (req, fn, ctx) {
      this._reqs = this._reqs || {};
      ctx = ctx || this;
      delete this._reqs[req];
    }
  };


  function _execute (handler, args) {
    if (!handler) return null;
    switch (args.length) {
      case 0: return handler.fn.call(handler.ctx);
      case 1: return handler.fn.call(handler.ctx, args[0]);
      case 2: return handler.fn.call(handler.ctx, args[0], args[1]);
      case 3: return handler.fn.call(handler.ctx, args[0], args[1], args[2]);
      case 4: return handler.fn.call(handler.ctx, args[0], args[1], args[2],args[3]);
      default: return handler.fn.apply(handler.ctx, args);
    }
  }

  Mediator.Commands = Commands;
  Mediator.Requests = Requests;

  assign(Mediator.prototype, Commands, Requests);

  return Mediator;

})(EventEmitter);
