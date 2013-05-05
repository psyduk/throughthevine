module.exports = function (app) {
  // Include Static Controller
  var static = require('../app/controllers/static');

  // Set Root
  app.get('/', static.home);


  // Include Vine Controller
  var vine = require('../app/controllers/vine');
  app.get('/share/:id', vine.share);
  app.get('/vine', vine.get);
}
