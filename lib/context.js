
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var context = _interopRequire(require("koa/lib/context"));

var assign = _interopRequire(require("object-assign"));

var deprecate = require("util").deprecate;

module.exports = context;

Object.defineProperty(context, "isXHR", {
  get: function get() {
    let xhr = this.get("X-Requested-With");
    return xhr === "XMLHttpRequest";
  }
});

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
  xhr: deprecate(function () {
    return this.isXHR;
  }, "context.xhr(): use context.isXHR instead")

});