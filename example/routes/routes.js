
'use strict';

module.exports = function () {
  this.get('/:id', function *(next) {
    yield next;
    console.log('raprap')
  });

  this.get('/:id', function *(next) {
    console.log(this.params)
    this.body = this.params;
    yield next
  })
};
