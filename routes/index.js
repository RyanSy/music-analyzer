var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var app = express();
var request = require('request');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: 'Music Analyzer',
                        author: 'Ryan Sy' });

});

// Analyze Track
router.post('/search', function(req, res, next) {

  console.log('req.body =>', req.body);

  request('https://api.spotify.com/v1/search?q=' + req.body.trackName + '&type=track', function(error, response, body) {

    if (!error && response.statusCode == 200) {

        var parsedBody = JSON.parse(body);
        var result = parsedBody.tracks.items[0];
        var hbsObject = {
          'artist': result.artists[0].name,
          'title': result.name,
          'id': result.id
        }
        res.render('results', hbsObject);

    } else {
      console.log(error);
    }
    
  });
});

module.exports = router;
