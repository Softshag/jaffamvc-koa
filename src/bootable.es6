'use strict';

import eos from 'end-of-stream';
import dbg from 'debug';
import co from 'co';
import * as utils from './utils';
import Promise from 'native-or-bluebird';
import {EventEmitter} from 'events';
import assign from 'object-assign';

let debug = dbg('mvc:boot');

let noop = function *() {};

export class Task {
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

      let {fn,context} = this.options;

      // Node style callback
      if (fn.length === 1) {
        return fn.call(context, done);
      // Generator
      } else if (utils.isGenerator(fn) || utils.isGeneratorFunction(fn)) {
        fn = co.wrap(fn);
      }

      const ret = fn.call(context);

      if (ret && ret instanceof Error) {
        reject(ret);
      // Streams
      } else if (ret && typeof ret.pipe === 'function') {
        eos(ret, done);
      } else if (ret && typeof ret.then === 'function') {
        ret.then(resolve,reject);
      } else {
        resolve(ret);
      }
     });
  }
}

let bootable = {
  /**
   * Run phases
   * @return {Promise}
   */
  boot () {

    const emit = this.emit.bind(this) || noop;
    let phases = this._phases || [];

    emit('before:boot');
    let len = phases.length;

    return co(function *() {
      let task;

      for (var i=0;i<len;i++) {
        task = phases[i];

        debug('running phase %s', task.options.name);

        emit('before:run',task);
        yield task.run();
        emit('run', task);
      }

      emit('boot');

    }.bind(this));

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
      name = fn.name || 'unnamed';
    }

    if (typeof fn !== 'function') {
      throw new Error('fn not a function');
    }

    debug('adding phase: %s', name);

    let task = new Task({
      name: name,
      fn: fn,
      context: context || this
    });

    this._phases.push(task);

    return task;
  }
};

export default bootable;
export class Booter extends EventEmitter {}

assign(Booter.prototype, bootable);
