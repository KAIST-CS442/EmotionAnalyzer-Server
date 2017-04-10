var express = require('express');
var router = express.Router();

/* GET face post data */

router.post('/', function(req, res, next) {
    res.send({"ok":"Succeed"});
    console.log("post requested");
    //console.log(req.body);
    var userId = req.body.userId;
    var videoId = req.body.videoId;
    var image = req.body.image;
    console.log(userId);
    console.log(videoId);
    base64_decode(image, 'test.jpg');
});

var fs = require('fs');


/* Referred https://www.hacksparrow.com/base64-encoding-decoding-in-node-js.html for base64 encoding and decoding */
// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}

module.exports = router;
