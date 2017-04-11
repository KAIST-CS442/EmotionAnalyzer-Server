var express = require('express');
var router = express.Router();
var request = require('request');
require('dotenv').config();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/upload', function(req, res) {
  var headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': process.env.EMOTION_API_KEY 
  }

  var options = {
    url: "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize",
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      url: 'http://cdn0.mos.techradar.futurecdn.net/art/mobile_phones/Sony/XperiaZ3Compact/Compact%20review%202/DSC_0044-420-90.JPG'
    })
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var object = JSON.parse(body);
      console.log(object);
    }
  });
});

module.exports = router;
