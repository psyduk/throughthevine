var request  = require('request'),
    mongoose = require('mongoose'),
    Share    = mongoose.model('Share'),
    qs       = require('querystring'),
    $        = require('cheerio'),
    transliterator = require('transliterator');

var vidRequest = function (search, query, location, page, cb) {
  request('http://search.twitter.com/search.json?rpp=6&' + search, function (e, r, body) {
    if (e) { throw e; }
    var tweets = JSON.parse(body).results;

    if (Object.keys(tweets).length < 6) {
      res.render('static/home', { error: 'Not Enough Results' } );
    }

    var vineVids = [];
    var vidUrls = {};
    tweets.forEach(function (val) {
      //find the video url
      var videoURL = val.text.match(/https?:\/\/t\.co\/\w+/);
      if (videoURL) {
        var vid = {};
        vid.url = videoURL[0].replace('”', '').replace('"', '');
        request(vid.url, function (e, r, body) {
          var $body = $.load(body),
              $user = $.load($body('.info').html());

          vid.video    = $body('source').attr('src');
          vid.poster   = $body('video').attr('poster');
          vid.avatar   = $user('.avatar').attr('src');
          vid.username = $user('h2').html();

          if($user('p').html()) {
            vid.tagline  = transliterator($user('p').html());
          }

          //make sure we haven't already displayed a video from this user
          if (!vidUrls[vid.url] && vid.avatar && vid.video && vid.username) {
            vineVids.push(vid);
            vidUrls[vid.url] = true;
          }

          if (vineVids.length === 12) {
            var share = new Share({query: query, vid: vineVids, location: location});
            share.save(function (err, share) {
              if (err) { return console.log(err); }
              cb({ query: query, vids: vineVids, id: share.id });
            });
          }
        });
      }
    });
  });
};

exports.share = function (req, res) {
  var id = req.params.id;

  Share.findById(id, function (err, share) {
    if (err) { return next(err); }
    res.render('vine/show', { query: share.query, vids: share.vid, id: share.id });
  });
};

exports.get = function (req, res) {
  var query  = req.query.keywords,
      location = req.connection.remoteAddress,
      search = 'vine.co ' + query;
      search = qs.stringify({ q: search });

    vidRequest(search, query, location, 0, function (obj) {
      res.render('vine/show', obj);
    });
};

exports.page = function (req, res) {
  var query  = req.query.keywords,
      location = req.connection.remoteAddress,
      search = 'vine.co ' + query;
      search = qs.stringify({ q: search });

    vidRequest(search, query, location, 0, function (obj) {
      res.json(obj);
    });
};
