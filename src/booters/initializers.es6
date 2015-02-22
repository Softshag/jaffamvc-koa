
'use strict';

import * as utils from '../utils';
import Path from 'path';
import dbg from 'debug';

let debug = dbg('mvc:boot');

export default function (path, ctx) {

  if (!utils.fileExistsSync(path))
    throw new Error('path ' + path + ' does not exists!');

  path = Path.resolve(path);

  return function () {
    ctx = ctx || this;
    return utils.requireDir(path, function *(mod, file) {
      debug('evaluating %s',file);
      return yield mod.call(ctx);
    });
  };

};
