
'use strict';

var util = require('util');


function DispatchError (message) {
  Error.call(this, message);
  this.message = message;
}

util.inherits(DispatchError, Error);


module.exports = DispatchError;
