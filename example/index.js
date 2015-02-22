
var profiler = require('../lib/middlewares/profiler');
var logger = require('../lib/middlewares/logger.js');
var jaffamvc, app;

Jaffamvc = require('../index');

app = new Jaffamvc();

console.log(Jaffamvc)

app.phase('some', function (done) {
  console.log('some phase', this === app)
  setTimeout(done, 1000)
});

app.phase('other', function *() {
  console.log('some other phase', this === app)
});

app.use(profiler());
app.use(logger());

app.on('before:run', function (task) {
  //console.log('task', task)
})

app.start(3000).then(function () {
  console.log('Application listening on port 3000')
}).catch(function (err) {
  console.log(err.stack);
});
