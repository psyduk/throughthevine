var cons             = require('consolidate'),
    express          = require('express'),
    swig             = require('swig'),
    url              = require('url'),
    viewHelpers      = require('./middlewares/view');

var __root = function() {
  return require('path').normalize(__dirname + '/..');
};

module.exports = function (app) {
  app.set('showStackError', true);
  app.use(express.static( __root() +'/public'));
  app.use(express.logger('dev'));

  // set views path, template engine and default layout
  app.engine('html', cons.swig);
  swig.init({ root: __root() + '/app/views', allowErrors: true });
  app.set('views', __root() + '/app/views');
  app.set('view engine', 'html');

  app.configure(function () {

    // dynamic helpers
    // app.use(viewHelpers(config));

    // bodyParser should be above methodOverride
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.favicon());

    // routes should be at the last
    app.use(app.router);
  });
};