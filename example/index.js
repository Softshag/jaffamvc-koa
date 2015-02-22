
var profiler = require('../lib/middlewares/profiler');
var logger = require('../lib/middlewares/logger.js');
var jaffamvc, app;

Jaffamvc = require('../index');

app = new Jaffamvc();


app.phase('some', function () {
  console.log('some phase');

});


app.use(profiler());
app.use(logger());

app.on('run', function (task) {
  console.log('task', task)
})

app.start(3000).then(function () {
  console.log('Application listening on port 3000')
}).catch(function (err) {
  console.log(err.stack);
});
