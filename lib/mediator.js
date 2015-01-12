
'use strict';

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    assign = require('object-assign');


var __slice = Array.prototype.slice;

module.exports = (function (__super) {

  util.inherits(Mediator, EventEmitter);

  /**
   * Mediator
   * @constructor Mediator
   */
  function Mediator (name) {
    this.name = name;
    this._handlers = [];
    EventEmitter.call(this);
  }

  assign(Mediator.prototype, {
    comply: function (name, handler, ctx) {
      if (this.complyTo(name)) {
        throw new Error('Comply is already defined: ' + handler);
      }
      this._handlers.push({
        name: name,
        fn: handler,
        ctx: ctx || this,
        type: 'command'
      });
    },
    stopComplying: function (name, handler, ctx) {
      _remove(this._handlers, name, 'command');
    },
    command: function (name, args) {
      var cmd = _find(this._handlers, name, 'command');
      _execute(this._handlers, cmd, __slice.call(arguments, 1));
    },
    complyTo: function (name) {
      return !!_find(name, 'command');
    },
    reply: function (name, handler, ctx) {
      if (this.replyTo(name)) {
        throw new Error('Reply is already defined: ' + handler);
      }
      this._handlers.push({
        name: name,
        fn: handler,
        ctx: ctx || this,
        type: 'request'
      });
    },
    stopReplying: function (name, handler, ctx) {
      _remove.call(this, name, 'request');
    },
    request: function (name, args) {
      var cmd = _find(this._handlers, name, 'request');

      return _execute(cmd, __slice.call(arguments, 1));
    },
    replyTo: function (name) {
      return !!_find(this._handlers, name, 'request');
    }
  });

  function _remove (list, name, type) {
    var cmd = _find(list, name, type);
    if (!cmd) return;
    list.splice(list.indexOf(cmd),1);
  }

  function _find (list, name, type) {
    var item, i;
    for (i = 0; i<list.length; i++) {
      item = list[i];

      if (item.name === name && item.type === type)
        return item;
    }
  }

  function _execute (handler, args) {
    if (!handler) return null;
    var len = args.length;
    switch (len) {
      case 0: return handler.fn.call(handler.ctx);
      case 1: return handler.fn.call(handler.ctx, args[0]);
      case 2: return handler.fn.call(handler.ctx, args[0], args[1]);
      case 3: return handler.fn.call(handler.ctx, args[0], args[1], args[2]);
      default: return handler.fn.apply(handler.ctx, args);
    }
  }

  return Mediator;

})(EventEmitter);
