
'use strict';

module.exports = {
  initialize: function (options) {
    this.opt = options;
    this.app.logger.info('this is run before');
  },
  index: function *() {
    if (this.xhr()) {
      console.log('from')
    }
    this.body = "This is home: Hello, " + this.opt.hello;
  }
};
