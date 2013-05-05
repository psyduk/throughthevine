// Require Dependencies
var cheerio    = require('cheerio'),
    cronJob    = require('cron').CronJob,
    feedparser = require('feedparser'),
    mongoose   = require('mongoose'),
    request    = require('request'),
    qs         = require('querystring'),
    url        = require('url'),
    Article    = mongoose.model('Article'),
    Feed       = mongoose.model('Feed'),
    Song       = mongoose.model('Song');

var logger = function (err) {
  console.error(err);
};

// Helper function for adding songs
var addSong = exports.addSong = function (stream_url, title, artist, articleId, feedId) {
  var song = new Song({
    artist: artist,
    title: title,
    url: stream_url,
    _article: articleId,
    _feed: feedId
  });
  song.save(function (err, song) {
    if (err) { if (err.code !== 11000) { console.log(err);} return;}
    // Increment the song count by one on feed and article
    Feed.findByIdAndUpdate(feedId, {$inc: {songCount: 1}}, function (err, feed){
      if (err) { return logger(err); }
    });
    Article.findByIdAndUpdate(articleId, {$inc: {songCount: 1}}, function (err, article){
      if (err) { return logger(err); }
    });
  });
};

// Helper function for adding articles
var addArticle = exports.addArticle = function (title, url, guid, pubDate, feedId) {
  var article = new Article({
    _feed: feedId,
    guid: guid,
    pubDate: pubDate,
    title: title,
    url: url
  });
  article.save(function (err, article){
    if (err) { if (err.code !== 11000) { logger(err); } return;}
    // Increment the article count by one
    Feed.findByIdAndUpdate(feedId, {$inc: {articleCount: 1}}, function (err, feed){
      if (err) { return logger(err); }
    });
  });
};

// Gets a list of all feed urls and passes each url into parseArticles
var parseAllFeeds = exports.parseAllFeeds = function () {
  Feed.find({active: true}, function (err, feeds){
    if (err) { return logger(err); }
    return feeds.forEach(function (feed) { parseArticles(feed.url, feed._id); });
  });
};

// Gets a list of all the articles that have not been parsed,
// passing the url into parseSongs, then sets parsed to true;
var parseAllArticles = exports.parseAllArticles = function () {
  Article.find({parsed: false}, function (err, articles){
  // Article.find(function (err, articles){
    articles.forEach(function (article) {
      parseSongs(article.url, article.id, article._feed);
      Article.findByIdAndUpdate(article.id, {parsed: true}, function () {});
    });
  });
};

// Gets all the articles from a passed in RSS feed.  Then checks to see
//  if the article has a unique GUID or not. 
var parseArticles = exports.parseArticles = function (siteUrl, feedId) {
  request(siteUrl)
  .pipe(new feedparser())
  // .on('error', function (err) {
  //   logger(err);
  // })
  .on('error', logger)
  .on('complete', function (meta, articles) {
    for(key in articles){
      var article = articles[key];
      addArticle(article.title, article.link, article.guid, article.guid, feedId);
    }
  });
};

// pass in a /tracks/SONGCLOUDID to get back an object with stream_url, artist, title
var getSoundCloudTrackInfo = exports.getSoundCloudTrackInfo = function (trackUrl, callback) {
  var client_id  = '951131645472ee6042892af6cac03167',
      soundcloud = 'http://api.soundcloud.com' +
                    trackUrl +
                    '.json?client_id=' +
                    client_id;
  request(soundcloud, function (err, res, body){
    var song = JSON.parse(body);
    // Check to see if song has a stream_url => if not means is a playlist
    if (song.stream_url !== undefined) {
      callback({
        stream_url: song.stream_url, 
        title: song.title, 
        artist: song.user.username
      });
    }
  });
};

// Goes through the URL passed in and checks for soundcloud/mp3's
var parseSongs = exports.parseSongs = function (siteUrl, articleId, feedId) {
  request(siteUrl, function (err, res, body) {
    if (err) { return logger(err); }
    if (res.statusCode !== 200) { return logger(res.statusCode); }
    var $    = cheerio.load(body),
        srcs = {};

    var grabUrl = function (element, attr) {
      $(element).each(function () {
        var $this = $(this),
            href  = decodeURIComponent($this.attr(attr)),
            parse = url.parse(href),
            track;

        if (/soundcloud\.com$/.test(parse.host)) {
          if (!(track = href.match(/\/tracks\/\d+/))) { return; }
          return srcs[track[0]] = 'soundcloud';
        }

        if (/\.mp3$/.test(parse.pathname)) {
          return srcs[url.resolve(siteUrl, href)] = {
            title:  $this.attr('data-title'),
            artist: $this.attr('data-artist')
          };
        }
      });
    };

    grabUrl('iframe, embed', 'src');
    grabUrl('.play-music',   'data-mp3');

    Object.keys(srcs).forEach(function (src) {
      var song = srcs[src];

      if (song === 'soundcloud') {
        getSoundCloudTrackInfo(src, function (song) {
          addSong(song.stream_url, song.title, song.artist, articleId, feedId);
        });
      } else {
        if (!song.title || !song.artist) { return logger(song); }
        addSong(src, song.title, song.artist, articleId, feedId);
      }
    });
  });
};

// Every Minute
new cronJob('00 */1 * * * *', function (){
  parseAllFeeds();
  parseAllArticles();
  console.log('Parsed Songs/Feeds at: ', (new Date).toString());
// }, null, true, "America/Los_Angeles");
}, null, true, null);

