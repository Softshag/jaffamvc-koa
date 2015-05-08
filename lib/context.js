
"use strict";

var context = require("koa/lib/context"),
    assign = require("object-assign");

module.exports = context;

assign(context, {
  links: (function (_links) {
    var _linksWrapper = function links(_x) {
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
  }),
  xhr: (function (_xhr) {
    var _xhrWrapper = function xhr() {
      return _xhr.apply(this, arguments);
    };

    _xhrWrapper.toString = function () {
      return _xhr.toString();
    };

    return _xhrWrapper;
  })(function () {
    let xhr = this.get("X-Requested-With");
    return xhr === "XMLHttpRequest";
  })
});