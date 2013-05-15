var request  = require('request'),
    mongoose = require('mongoose'),
    Share    = mongoose.model('Share'),
    qs       = require('querystring'),
    $        = require('cheerio'),
    transliterator = require('transliterator');

var vidRequest = function (search, query, location, page, cb) {
  request('http://search.twitter.com/search.json?rpp=6&page='
    + page + '&' + search, function (e, r, body) {
    if (e) { throw e; }
    var tweets = JSON.parse(body).results;

    if (Object.keys(tweets).length < 6) {
      cb({ error: 'Not Enough Results' });
    }

    var vineVids = [],
        vidUrls = {};

    tweets.forEach(function (val) {
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
          // if(!vineVids[vid.video])
          //make sure we haven't already displayed a video from this user
          if (vid.avatar && vid.video && vid.username) {
            vineVids.push(vid);
            vidUrls[vid.video] = true;
          }

          if (vineVids.length === 3) {
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
  var query    = req.query.keywords,
      location = req.connection.remoteAddress,
      search   = 'vine.co ' + query;
      search   = qs.stringify({ q: search }),
      page     = 1;

    vidRequest(search, query, location, 1, function (obj) {
      if (obj.hasOwnProperty('error')) {
        res.render('static/home', { error: 'Not Enough Results'});
      } else {
        res.render('vine/show', obj);
      }
    });
};

exports.page = function (req, res) {
  var query    = req.query.keywords,
      location = req.connection.remoteAddress,
      search   = 'vine.co ' + query;
      search   = qs.stringify({ q: search }),
      page     = req.query.page;

    vidRequest(search, query, location, page, function (obj) {
      if (obj.hasOwnProperty('error')) {
        res.json({ error: 'Not Enough Results' });
      } else {
        res.json(obj);
      }
    });
};
