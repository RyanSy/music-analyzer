var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var app = express();
var request = require('request');
var client_id = '071dc603c44247319f007ce6bc89be08';
var client_secret = 'b769223019aa445f991143cc713a0297';

var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId : '071dc603c44247319f007ce6bc89be08',
  clientSecret : 'b769223019aa445f991143cc713a0297',
  redirectUri : 'http://localhost:3000/results'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'Music Analyzer', author: 'Ryan Sy'});
});

// Analyze Track
router.post('/search', function(req, res, next) {
  // console.log('req.body =>', req.body);

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
    } else {
      console.log(error);
    }

    // get track info request
    request('https://api.spotify.com/v1/search?q=' + req.body.trackName + '&type=track', function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var parsedBody = JSON.parse(body);
        var trackInfo = parsedBody.tracks.items[0];
        var trackId = trackInfo.id;
        console.log('trackInfo =>', trackInfo);
      } else {
        console.log(error);
      }
      // use the access token to access the Spotify Web API
      var options = {
        url: 'https://api.spotify.com/v1/audio-features/' + trackId,
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        json: true
      };
      request.get(options, function(error, response, body) {
        console.log(body);
        res.json(body);
      });
    });
  }); // end post request for access token
}); // end post route

module.exports = router;
