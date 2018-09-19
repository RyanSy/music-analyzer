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

        // get track info
        var audioTrack = {
            url: 'https://api.spotify.com/v1/search?q=' + trackTitleModified + '&type=artist,track',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            json: true
        };

        request.get(audioTrack, function(error, response, body) {
            console.log('> statusCode: ', response.statusCode);
            if (!error && response.statusCode == 200) {
                console.log('> GET request for track info response body: ', body);
                var trackInfo = body.tracks.items[0];
                console.log('> trackInfo: ', trackInfo);
                var trackId = trackInfo.id;
            } else {
                res.render('not-found');
                console.log('> error requesting track info: ', error);
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
                if (!error && response.statusCode == 200) {
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
