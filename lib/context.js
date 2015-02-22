"use strict";

var context = require("koa/lib/context"),
    assign = require("object-assign");

module.exports = context;

assign(context, {
  links: (function (_links) {
    var _linksWrapper = function links() {
      return _links.apply(this, arguments);
    };

    _linksWrapper.toString = function () {
      return _links.toString();
    };

    return _linksWrapper;
  })(function (links) {
    var link = this.response.get("Link") || "";
    if (link) link += ", ";
    return this.response.set("Link", link + Object.keys(links).map(function (rel) {
      return "<" + links[rel] + ">; rel=\"" + rel + "\"";
    }).join(", "));
  })
});