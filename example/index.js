

var jaffamvc, app;

jaffamvc = require('../lib');

app = jaffamvc();



app.default().start().then(function () {
  this.listen(3000);
}).catch(function (err) {
  console.log(err);
});
