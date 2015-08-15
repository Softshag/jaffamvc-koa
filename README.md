# JaffaMVC



## Project structure
The default directory structure:

```
project
|-- controllers
    |... controllers
|-- initializers
    |... intializers
|-- routes
    |... routes
|-- views
    |... views

```

## Application

```javascript

var app = new JaffaMVC();

app.start().then(function () {
  app.listen(PORT);
}).catch(function (err) {
  app.logger.error(err);
});

// Or you can just do
app.start(PORT);

```

## Routes

```javascript
// file: ./routes/route.js
module.export = function () {
  // http method
  this.get('/', function *(next) {
    this.body = 'Hello, world!';
  });
  
  this.get('/home', function *(next) {
    console.log('someone\'s knocking!');
    yield *next;
    console.log('oh...');
  }, function *() {
    this.body = 'Glad to see you home';
  }
  // regexp
  this.get(/number\/([0-9]+)/,....);
  
  // parameters
  this.get('/decimal/:decimal',function *(next) {
    console.log(this.params.decimal);
    yield *next;
  });
  
  // Controller method matching
  this.match('/admin', middleware, 'admin#index');

  // API's (CRUD)
  this.resources('api');
  
  // namespacing
  let admin = this.namespace('/admin', authenticate(), function* () {
    this.match('/', 'admin#show');
    this.match('/update', 'admin#update', {via:'post'}); // POST /admin/update
  })
  // The closure-style is optional.
  admin.get(....);

};


```
