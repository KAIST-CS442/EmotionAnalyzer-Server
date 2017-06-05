var express = require('express');
var router = express.Router();
var request = require('request');

var mongoose = require('mongoose');

var Highlight = require('../models/Highlight');
var Reaction = require('../models/Reaction');
var Video = require('../models/Video');

var fs = require('fs');
var youtubedl = require('youtube-dl');
var ffmpeg = require('fluent-ffmpeg');

var cron = require('node-cron');

cron.schedule('*/5 * * * *', function() {
    Video.find()
    .exec(function (err, videos) {
        for (var i = 0; i < videos.length; i++) {
            generate_highlight(videos[i].video_id, videos[i].video_name);
        }
    });
});

/*
 * GET highlight info
 * Query: video_id (?video_id=xxxxx)
 */
router.get('/', function(req, res, next) {
    //generate_highlight(req.query.video_id);
    Highlight.findOne({
        video_id: req.query.video_id
    })
    .exec(function (err, highlight) {
        if (err) return console.log(err);
        if (!highlight) {
            console.log("No highlight")
        }
        else {
            // Uncomment this when using this API for testing.
            // res.end("http://143.248.198.68:3000/" + highlight.highlight_url);
        }
    });
});

/*
 * GET list of highlights
 * returns {"items": [{ video_id: 'video_id', video_name: 'video_name', 
 * highlight_url: 'highlight_url', thumbnail_url: 'thumbnail_url'}]}
 */
router.get('/list', function(req, res, next) {
    Highlight
    .find()
    .select('video_id video_name highlight_url thumbnail_url')
    .exec(function (err, highlights) {
        console.log(highlights);    
        if (err) console.error(err);
        res.end(JSON.stringify({
			items: highlights
		}));
    });
});

function generate_highlight(query_video_id, query_video_name) {
    console.log("generate highlight for " + query_video_id);
    var highlightId = 0;
    /* temp code */
    var thumbnailId = 0;

    Reaction.find({
        video_id: query_video_id
    })
    .exec(function (err, reactions) {
        var happinessAt = {};
        var maxTime = 0;
        /* Build a map (floor(time) -> listof<happiness_value>)
           and find maximum value of timestamp. */
        for (var i = 0; i < reactions.length; i++) {
            var time = parseInt(reactions[i].time / 1000);
            if (time > maxTime) maxTime = time;
            happinessAt[time] = happinessAt[time] || [];
            happinessAt[time].push(reactions[i].happiness);
        }
        /* Calculate the average of happiness values of each timestamp.
           Create an array whose index is floor(time) and value is the average. */
        var happinessAverage = Array(maxTime + 1).fill(0.0);
        for (var time in happinessAt) {
            var sum = happinessAt[time].reduce(function(a, b) { return a + b; });
            var avg = sum / happinessAt[time].length;
            happinessAverage[time] = avg;
        }
        /* Find the time region where happinessAverage > 0.7. (This is an empirical value)
           In order to ignore small holes, at most 3 consecutive disqualified values are tolerated.
           If a region is found, highlight is stored in the database, with 3 seconds back and front of the actual highlight.
           A region should be longer than 3 seconds. */
        var isHighlight = false;
        var tolerateCount = 0;
        var regionStartIndex = 0;
        var regionEndIndex = 0;
        for (var i = 0; i < happinessAverage.length; i++) {
            if (happinessAverage[i] > 0.7) {
                if (!isHighlight) {
                    isHighlight = true;
                    regionStartIndex = i;
                    console.log("regionStartIndex: " + regionStartIndex);
                }
                tolerateCount = 0;
            }
            else {
                if (isHighlight) {
                    tolerateCount += 1;
                    if (tolerateCount > 6) {
                        isHighlight = false;
                        regionEndIndex = i;
                        if (regionEndIndex - regionStartIndex > 5) {
                            
                            var newHighlight = new Highlight({
                                video_id: query_video_id,
                                start: regionStartIndex,
                                end: regionEndIndex,
                                highlight_url: query_video_id + '_highlight_' + highlightId + '.mp4',
                                thumbnail_url: query_video_id + '_thumbnail_' + thumbnailId + '.jpg',
                                video_name: query_video_name,
                            });
                            newHighlight.save();
                            highlightId += 1;
                            thumbnailId += 1;
                        }
                    }
                }
            }
        }
    });

    if (highlightId >= 0) {
        var video = youtubedl('http://www.youtube.com/watch?v=' + query_video_id, [], {maxBuffer: 100000*1024});
        video.on('info', function(info) {
            console.log('Download started');
            console.log('filename: ' + info._filename);
            console.log('size: ' + info.size);
        });
        video.pipe(fs.createWriteStream('./public/' + query_video_id + '.mp4'));

        video.on('end', function() {
            console.log('Download done');
            Highlight.find({
                video_id: query_video_id
            })
            .exec(function (err, highlights) {
                for (var i = 0; i < highlights.length; i++) {
                    var start = highlights[i].start;
                    var end = highlights[i].end;

                    start -= 3;
                    if (start < 0) start = 0;
                    var duration = end - start;
                    console.log("ffmpeg start: " + start);
                    console.log("ffmpeg duration: " + duration);
                    console.log(query_video_id + '.mp4');

                    ffmpeg('./public/' + query_video_id + '.mp4')
                    .setStartTime(start)
                    .setDuration(parseInt(duration))
                    .output('./public/' + query_video_id + '_highlight_' + i + '.mp4')
                    .on('end', function(err) {
                        if(!err)
                        {
                            console.log('conversion Done');
                        }
                    })
                    .on('error', function(err){
                        console.error(err);
                    }).run();

                    ffmpeg('./public/' + query_video_id + '.mp4')
                    .screenshots({
                        timestamps: [start],
                        filename: query_video_id + '_thumbnail_' + i + '.jpg',
                        folder: './public/'
                    });
                }
            });
        });
    }
}

/*
 * POST save highlight info to DB
 * Parameters: video_id, start, end, highlight_url
 */
router.post('/save', function(req, res, next) {
    var newHighlight = new Highlight({
        video_id: req.body.video_id,
        start: req.body.start,
        end: req.body.end,
        highlight_url: req.body.highlight_url,
    });

    newHighlight.save();
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end();
});

module.exports = router;
