var request  = require('request'),
    mongoose = require('mongoose'),
    Share    = mongoose.model('Share'),
    qs       = require('querystring'),
    $        = require('cheerio');

exports.share = function (req, res ) {

};

exports.get = function(req, res) {
  var query  = req.query.keywords,
      search = 'vine ' + query;
      search = qs.stringify({q: search});

  request("http://search.twitter.com/search.json?" + search, function (e, r, body) {
    if (e) { throw e }
    var tweets = JSON.parse(body).results;

    if ( Object.keys(tweets).length < 5) {
      // TODO: RENDER ERROR MESSAGE
      console.log('not enough results');
    }

    var vineVids = [];
    tweets.forEach(function (val) {
      //find the video url
      var videoURL = val.text.match(/https?:\/\/t\.co\/\w+/);
      if(videoURL) {
        var vid = {};
        vid.url = videoURL[0].replace('”', '').replace('"', '');
        request(vid.url, function (e, r, body) {
          var $body = $.load(body),
              $user = $.load($body('.info').html());

          vid.video    = $body('source').attr('src');
          vid.poster   = $body('video').attr('poster');
          vid.avatar   = $user('.avatar').attr('src');
          vid.username = $user('h2').html();
          vid.tagline  = $user('p').html();
          vineVids.push(vid);

          if (vineVids.length === 3 ) {
            // Save into database for reference later
            var share = new Share({query: query, vid: vineVids});
            share.save(function (err, share) {
              if (err) { return next(err); }
              res.render('vine/show', { query: query, vids: vineVids, id: share.id });
            });
          }
        });
      }
    });
  });
};
