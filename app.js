// Load dependencies
var express    = require('express'),
    fs         = require('fs');

// Bootstrap models
var models_path = __dirname + '/app/models';
fs.readdirSync(models_path).forEach(function (file) {
  require(models_path + '/' + file);
});

// Initialize Express application
var app = express(),
    mongoose = require('mongoose');

// Bootstrap db connection
mongoose.connect('mongodb://musicbox:musicbox@dharma.mongohq.com:10019/Musicbox');

// express settings
require('./config/express')(app);

// Bootstrap routes
require('./config/routes')(app);

// Start the app by listening on <port>
var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express app started on port ' + port);
