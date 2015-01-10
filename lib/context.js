
'use strict'

var context = require('koa/lib/context'),
    assign = require('object-assign');

module.exports = context;

assign(context, {
  links: function(links){
    var link = this.response.get('Link') || '';
    if (link) link += ', ';
    return this.response.set('Link', link + Object.keys(links).map(function(rel){
      return '<' + links[rel] + '>; rel="' + rel + '"';
    }).join(', '));
  }
});
