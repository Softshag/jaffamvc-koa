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
