var express = require('express');
var router = express.Router();
var fs = require('fs');
var request = require('request');
var mongoose = require('mongoose');
var Reaction = require('../models/Reaction');
require('dotenv').config();

var baseDirName = 'local3_image';
/* GET face post data */

router.post('/', function(req, res, next) {
    console.log("post requested");
    //console.log(req.body);
    var userId = req.body.userId;
    var videoId = req.body.videoId;
    var time = req.body.time; // time in millisecond
    var image = req.body.image;
    console.log(userId);
    console.log(videoId);
    console.log(time);
    var newDirName = baseDirName + videoId + userId;
    if (!fs.existsSync(newDirName)) {
        try {
            fs.mkdirSync(newDirName);
        } catch (err) {
            if (err.code !== 'EEXIST') throw err
        }
    }
    var fileName = 'image' + '_' + time + '.jpg';
    var fullFileName = newDirName + '/' + fileName;
    base64_decode(image, fullFileName);
    console.log(fullFileName);
    requestAPI(newDirName, fileName, time, userId, videoId);
    res.send({"ok":"Succeed"});
});

/* In browser enter url: http://localhost:3000/face?dirName=DirectoryNameOfYourTargetFolder
 * Erase or backup existing result.txt or parsed_result.txt files.
*/
router.get('/', function(req, res) {
    console.log(req.query.dirName); 
    // Loop through files in 'test_image' directory
    fs.readdir(req.query.dirName,function (err, files) {
        var targetFiles = [];
        for (var i = 0; i < files.length; i++) {
            var token = files[i].split(".");
            if (token[token.length-1] == "jpg") {
                targetFiles.push(files[i]);
            }
        }
        console.log(targetFiles);
        for (var i = 0; i < targetFiles.length; i++) {
            setTimeout(function (fileName, i, filesLength) {
                var splitString = fileName.split(".");
                var time = splitString[0].split("_")[1];
                console.log("Processing " + (i+1) + "th file out of " + filesLength + " files");
                console.log(fileName);
                requestAPI(req.query.dirName, fileName, time);
            }, i * 1000 * 5, targetFiles[i], i, targetFiles.length) // delay about 5 seconds;
        }
    });
    res.send({"ok":"Succeed"});
});

function requestAPI(dirName, fileName, time, userId, videoId) {
    console.log("requested to API");
    var bitmap = fs.readFileSync(dirName + '/' + fileName);

    var headers = { 
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': process.env.EMOTION_API_KEY 
    }   

    var options = { 
        url: "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize",
        method: 'POST',
        headers: headers,
        body: bitmap
    }   

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var object = JSON.parse(body);
            fs.appendFileSync(dirName + '/' + 'result.txt', JSON.stringify(object)+'\n', 'utf8');
            if (object.length != 0){
                var emotions = object[0].scores;
                var addLine = "" + time + " " + emotions.anger + " " +  emotions.contempt + " " + emotions.disgust + " " + emotions.fear + " " + emotions.happiness + " " + emotions.neutral + " " +  emotions.sadness + " " + emotions.surprise + "\n";
                fs.appendFileSync(dirName + '/' + 'parsed_result.txt', addLine);

                var newReaction = new Reaction({
                  video_id: videoId,
                  user_id: userId,
                  time: time,
                  happiness: emotions.happiness,
                  neutral: emotions.neutral,
                });
                newReaction.save();
            } else {
                var addLine = "" + time + "\n";
                fs.appendFileSync(dirName + '/' + 'parsed_result.txt', addLine);
            }
            console.log("done for time: " + time);
            console.log(object);
        } else {
            console.log("Request failed: " + response.statusCode);
        }
    }); 
}


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
    console.log(file);
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}

module.exports = router;
