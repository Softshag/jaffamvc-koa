'use strict';

import eos from 'end-of-stream';
import util from 'util';
import Promise from 'bluebird';
import dbg from 'debug';
import Utils from './utils';

let debug = dbg('mvc:boot');

function noop () {}

class Task {
  constructor(options) {
    super();
    this.options = options;
  }

  run() {
    return new Promise((resolve, reject) => {

      const done = function (err) {
        if (err) return reject(err);
        resolve();
      };

      const {fn,context} = this.options;

      if (fn.length === 1) {
        return fn.call(context, done);
      }

      const ret = fn.call(context);

      if (ret && ret instanceof Error) {
        reject(ret);
      } else if (ret && typeof ret.pipe === 'function') {
        eos(ret, done);
      } else if (ret && typeof ret.then === 'function') {
        ret.then(resolve,reject);
      } else {
        resolve();
      }
     });
  }
}

module.exports = {
  /**
   * Run phases
   * @return {Promise}
   */
  boot () {

    const emit = this.emit.bind(this) || noop;
    let phases = this._phases;

    emit('before:boot');

    let p = Utils.eachAsync(phases, (task, next) => {
      emit('before:run', task);
      debug('run phase: %s',task.options.name || "unnamed");

      task.run().then(() => {
        next();
      } , next);

    });
    // Return a bluebird promise.
    return Promise.resolve(p).then(function () {
      emit('boot');
    });
  },
  /**
   * Add new phase the the runner
   * @param {String} [name]
   * @param {Function} fn
   * @param {Object} [context]
   * @return {Task}
   */
  phase (name, fn, context) {
    this._phases = this._phases || [];

    if (!fn) {
      fn = name;
      name = null;
    }

    if (typeof fn !== 'function') {
      throw new Error('fn not a function or is not a function');
    }

    debug('adding phase: %s', name || 'unnamed');

    var t = new Task({
      name: name,
      fn: fn,
      context: context ||  this
    });

    this._phases.push(t);

    return t;
  }
};
