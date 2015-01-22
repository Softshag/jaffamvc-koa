
var profiler = require('../lib/middlewares/profiler');
var jaffamvc, app;

jaffamvc = require('../lib');

app = jaffamvc();

app.use(profiler());


app.start().then(function () {
  console.log('started')
  this.listen(3000);
}).catch(function (err) {
  console.log(err.stack);
});
