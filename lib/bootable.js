'use strict';

var EventEmitter = require('events').EventEmitter,
  eos = require('end-of-stream'),
  util = require('util'),
  Utils = require('./utils'),
  Promise = require('bluebird'),
  debug = require('debug')('mvc:boot');;


function Task(options) {
  EventEmitter.call(this);
  this.options = options;
}

util.inherits(Task, EventEmitter);

Task.prototype.run = function(_done) {

  var cb = function (err) {
    if (_done) _done(err);
    if (err) this.emit('error', err, this);
    else this.emit('complete', this);
  }.bind(this);

  var p = this.options;

  // Async with callback
  if (p.fn.length === 1)
    return p.fn.call(p.context, cb);

  var r = p.fn.call(p.context);

  if (r == null || r instanceof Error) {
    cb(r);
    // when returning a stream
  } else if (r && r.pipe === 'function') {
    eos(r, cb);
    // when returning a promisse(/A+)
  } else if (r && typeof r.then === 'function') {
    r.then(function() {
      cb(null);
    }, function(err) {
      cb(err);
    });
  }
};


module.exports = {
  boot: function(done) {
    var phases = this._phases;
    return new Promise(function (resolve, reject) {
      if (!phases) return resolve();

      Utils.eachAsync(phases,function (task, next) {
        debug('run phase: %s',task.options.name || "unnamed");
        task.run(next);
      }, function (err) {
        if (err) return reject(err);
        resolve();
      });
    }).nodeify(done);
  },

  phase: function(name, fn, context, cb) {
    this._phases = this._phases || [];

    if (!fn) {
      fn = name;
      name = null;
    }

    if (typeof context === 'function') {
      cb = context;
      context = null;
    }

    if (typeof fn !== 'function') {
      throw new Error('fn not a function');
    }
    debug('adding phase: %s', name || 'unnamed');
    var t = new Task({
      name: name,
      fn: fn,
      context: context ||  this,
      cb: cb
    });

    this._phases.push(t);

    return t;
  }
};
