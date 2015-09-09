
'use strict'

let logger = require('../lib/middlewares/logger.js'),
    profiler = require('../lib/middlewares/profiler'),
    JaffaMVC = require('../index');


let app = new JaffaMVC();

//app.use(logger());
//app.use(profiler());
const PORT = process.env.PORT || 3000;

app.start(PORT).then(function () {
  app.logger.info('Application listening on port: %s', PORT);

}).catch(function (err) {

  app.logger.error(err);
});
