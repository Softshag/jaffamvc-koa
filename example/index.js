
'use strict'

let logger = require('../lib/middlewares/logger.js'),
    JaffaMVC = require('../index');


let app = new JaffaMVC();

app.use(logger());

const PORT = process.env.PORT || 3000;

app.start(PORT).then(function () {
  app.logger.info('Application listening on port: %s', PORT);

}).catch(function (err) {
  app.logger.error(err.stack);
});
