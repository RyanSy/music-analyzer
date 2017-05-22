var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var app = express();
var request = require('request');
//
// var client_id = '071dc603c44247319f007ce6bc89be08';
// var client_secret = 'b769223019aa445f991143cc713a0297';

var client_id = process.env.CLIENT_ID;
var client_secret = process.env.CLIENT_SECRET;

// will refactor using SpotifyWebApi for API requests
var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: 'http://localhost:3000/results'
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// Render home page
router.get('/', function(req, res, next) {
    res.render('index');
});

// Analyze Track
router.post('/audio-features', function(req, res, next) {
    console.log('> req.body:', req.body);
    var trackTitle = req.body.trackName;
    var trackTitleModified = trackTitle.replace(/ /g, '+');
    console.log('> trackTitleModified: ', trackTitleModified);
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
        if (!error && response.statusCode === 200) {
            console.log('> POST request for access token response body: ', body);
            var access_token = body.access_token;
            console.log('> access_token: ', access_token);
        } else {
            console.log('> error in post request for access token: ', error);
        }

        // get track info request
        request('https://api.spotify.com/v1/search?q=' + trackTitleModified + '&type=artist,track', function(error, response, body) {
            if (!error && response.statusCode == 200) {
                // console.log('> GET request for track info response body: ', body);
                var parsedBody = JSON.parse(body);
                var trackInfo = parsedBody.tracks.items[0];
                // console.log('> trackInfo: ', trackInfo);
                var trackId = trackInfo.id;
            } else {
                res.send('Sorry, that title does not exist.');
                console.log('> error requesting track info: ', error);
            }

            // use the access token to access the audio features endpoint
            var audioFeatures = {
                url: 'https://api.spotify.com/v1/audio-features/' + trackId,
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                json: true
            };
            request.get(audioFeatures, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    // console.log('* GET request for track audio features response body => ', body);
                    var hbsObject = {
                        access_token: access_token,
                        artist: trackInfo.artists[0].name,
                        title: trackInfo.name,
                        id: trackInfo.id,
                        danceability: body.danceability,
                        energy: body.energy,
                        key: body.key,
                        loudness: body.loudness,
                        mode: body.mode,
                        speechiness: body.speechiness,
                        acousticness: body.acousticness,
                        instrumentalness: body.instrumentalness,
                        liveness: body.liveness,
                        valence: body.valence,
                        tempo: body.tempo,
                        duration_ms: body.duration_ms,
                        time_signature: body.time_signature
                    }
                    res.render('audiofeatures', hbsObject);
                } else {
                    console.log('> error in get request for audio features: ', error);
                }

            }); // end get request for track audio features
        }); // end get track info request
    }); // end post request for access token
}); // end audiofeatures post route

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
            // console.log('* GET request for track audio analysis response body => ', body);
            res.json(body);
        } else {
            console.log('> error getting audio analysis: ', error);
        }
    }); // end get request for track audio features
}); // end audioanalysis post route

module.exports = router;
