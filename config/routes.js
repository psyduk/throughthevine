module.exports = function (app) {
  // Include Static Controller
  var static = require('../app/controllers/static');

  // Set Root
  app.get('/', static.home);


  // Include Vine Controller
  var vine = require('../app/controllers/vine');
  app.post('/vine', vine.post);
}