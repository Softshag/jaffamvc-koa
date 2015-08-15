
'use strict';

import context from 'koa/lib/context';
import assign from 'object-assign';
import {deprecate} from 'util';

module.exports = context;

Object.defineProperty(context, 'isXHR', {
  get: function () {
    let xhr = this.get('X-Requested-With');
    return xhr === 'XMLHttpRequest';
  }
});


assign(context, {
  links: function(links){
    var link = this.response.get('Link') || '';
    if (link) link += ', ';
    return this.response.set('Link', link + Object.keys(links).map(function(rel){
      return '<' + links[rel] + '>; rel="' + rel + '"';
    }).join(', '));
  },
  xhr: deprecate(function () {
    return this.isXHR;
  },'context.xhr(): use context.isXHR instead')

});
