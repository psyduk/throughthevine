var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// Site schema
var ShareSchema = new Schema({
  vid        : [{
    url      : { type: String, required: true },
    video    : { type: String, required: true },
    poster   : { type: String, required: true },
    avatar   : { type: String, required: true },
    username : { type: String, required: true },
    tagline  : { type: String, required: true }
  }],
  location   : { type: String, default: '', trim: true, required: true },
  query      : { type: String, default: '', trim: true, required: true },
  created_at : { type: Date, default: Date.now }
});

// Validations
mongoose.model('Share', ShareSchema);