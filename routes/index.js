var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var app = express();
var request = require('request');
require('dotenv').config();

var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

router.get('/', function(req, res, next) {
    res.render('index');
});

router.post('/audiofeatures', function(req, res, next) {
    var searchQuery = (req.body.searchQuery).replace(/ /g, '+');
    // get access token
    var getToken = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };
    request.post(getToken, function(error, response, body) {
        var access_token;
        if (!error && response.statusCode === 200) {
            access_token = body.access_token;
        } else {
            console.log('Error getting access token: ', error);
            console.log('Response status code: ', response.statusCode);
        }

        // get track info
        var audioTrack = {
            url: 'https://api.spotify.com/v1/search?q=' + searchQuery + '&type=artist,track',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            json: true
        };
        request.get(audioTrack, function(error, response, body) {
            var trackId;
            if (!error && response.statusCode == 200 && (body.tracks.items).length > 0) {
                var trackInfo = body.tracks.items[0];
                trackId = trackInfo.id;
            } else {
                res.render('notfound');
                console.log('Error getting access token: ', error);
                console.log('Response status code: ', response.statusCode);
            }

            // get audio features
            var audioFeatures = {
                url: 'https://api.spotify.com/v1/audio-features/' + trackId,
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                json: true
            };
            request.get(audioFeatures, function(error, response, body) {
              var hbsObject = {};

              // determine key
              var keyValue = body.key;
              var key;
              switch(keyValue) {
                case 0:
                  key = 'C';
                  break;
                case 1:
                  key = 'C♯, D♭';
                  break;
                case 2:
                  key = 'D';
                  break;
                case 3:
                key = 'D♯, E♭';
                break;
                case 4:
                key = 'E';
                break;
                case 5:
                key = 'F';
                break;
                case 6:
                key = 'F♯, G♭ ';
                break;
                case 7:
                key = 'G';
                break;
                case 8:
                key = 'G♯, A♭';
                break;
                case 9:
                key = 'A';
                break;
                case 10:
                key = 'A♯, B♭';
                break;
                case 11:
                key = 'B';
              }

              // determine Mode
              var modeValue = body.mode;
              var mode;
              switch(modeValue) {
                case 0:
                mode = 'Minor';
                break;
                case 1:
                mode = 'Major';
                break;
              }

              var tempo = Math.round(body.tempo);

              function getDuraton(ms) {
                var minutes = Math.floor(ms / 60000);
                var seconds = ((ms % 60000) / 1000).toFixed(0);
                return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
              }

              var duration = (getDuraton(body.duration_ms)).toString();
              console.log('duration:', duration);

              if (!error && response.statusCode == 200) {
                trackFeatures = {
                  access_token: access_token,
                  image: trackInfo.album.images[0].url,
                  artist: trackInfo.artists[0].name,
                  title: trackInfo.name,
                  id: trackInfo.id,
                  danceability: body.danceability,
                  energy: body.energy,
                  key: key,
                  loudness: body.loudness,
                  mode: mode,
                  speechiness: body.speechiness,
                  acousticness: body.acousticness,
                  instrumentalness: body.instrumentalness,
                  liveness: body.liveness,
                  valence: body.valence,
                  tempo: tempo,
                  duration: duration,
                  time_signature: body.time_signature
                };
                  res.render('audiofeatures', trackFeatures);
              } else {
                  console.log('Error getting audio features: ', error);
                  console.log('Response status code: ', response.statusCode);
                }
            }); // end get request for track audio features
        }); // end get track info request
    }); // end post request for access token
}); // end audiofeatures post route

// deatiled analysis for later use
router.post('/audioanalysis', function(req, res, next) {
    // use the access token to access the audio features endpoint
    var audioAnalysis = {
        url: 'https://api.spotify.com/v1/audio-analysis/' + req.body.id,
        headers: {
            'Authorization': 'Bearer ' + req.body.access_token
        },
        json: true
    };
    request.get(audioAnalysis, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            res.json(body);
        } else {
            console.log('> error getting audio analysis: ', error);
        }
    }); // end get request for track audio features
}); // end audioanalysis post route

module.exports = router;
