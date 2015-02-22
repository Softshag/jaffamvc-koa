
'use strict';

module.exports = {
  initialize: function (options) {
    console.log(options)
  },
  index: function *() {
    this.body = "Tralla";
    console.log(this.xhr)
    this.logger.info('Doing the old %s', "tralalal");
  }
}
