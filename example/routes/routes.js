
'use strict';

module.exports = function *() {
  this.app.use(function *(next) {
    console.log('middle');
    yield *next;
    console.log('after middle');
  })
  this.get('/:id', function *(next) {
    console.log('get')
    yield next;
    console.log('after get')
  });

  this/*.param('id', function *(id, next) {
    if (!parseInt(id))
      return;
    yield *next;
  })*/.get('/:id', function *(next) {
    //return;
    console.log(this.params)
    yield *next;
    this.body += JSON.stringify(this.params);
    yield *next;
    console.log(this.links)
    //yield next;
  });

  this.get('/:id', function *(next) {
    this.body += "noget andet";
  })

  this.resources('/api/home',{
    controller: 'home',
    model: 'events',
    except: ['create', 'update']
  });

  this.namespace('/ns', function () {
    this.get('/den', function *() {
      this.body = "Rap rap"
    })
  })
};
