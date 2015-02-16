
var profiler = require('../lib/middlewares/profiler');
var logger = require('../lib/middlewares/logger.js');
var rpc = require('../modules/rpc');
var jaffamvc, app;

jaffamvc = require('../lib');

app = jaffamvc();


app.phase('some', function () {
  console.log('some phase');

});


app.use(profiler());
app.use(logger());

app.on('run', function (task) {
  console.log('task', task)
})

app.start().then(function () {
  console.log('started')
  this.listen(3000);
}).catch(function (err) {
  console.log(err.stack);
});
