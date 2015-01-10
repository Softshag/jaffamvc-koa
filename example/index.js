

var jaffamvc, app;

jaffamvc = require('../lib');

app = jaffamvc();

app.onAny(function () {
  console.log('all',this.event)
})
app.default().start().then(function () {
  this.listen(3000);
}).catch(function (err) {
  console.log(err.stack);
});
