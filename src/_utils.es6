
'use strict';

import co from 'co';

export function eachAsync (array, iterator) {

  return co(function *() {
    let i = 0, len = array.length;

    let next = function *(e) {
      if (e != null || i === len)
        return e ? throw e : null;
      yield iterator(array[i++], next);
    };

    yield next(null);

  });

}
