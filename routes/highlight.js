var express = require('express');
var router = express.Router();
var request = require('request');

var mongoose = require('mongoose');

var Highlight = require('../models/Highlight');
var Reaction = require('../models/Reaction');

/*
 * GET highlight info
 * Query: video_id (?video_id=xxxxx)
 */
router.get('/', function(req, res, next) {
    generate_highlight(req.query.video_id);
    Highlight.findOne({
        video_id: req.query.video_id
    }).
    exec(function (err, highlight) {
        if (err) return console.log(err);
        res.send(highlight);
    });
});

function generate_highlight(query_video_id) {
    Reaction.find({
        video_id: query_video_id
    }).
    exec(function (err, reactions) {
        var happinessAt = {};
        var maxTime = 0;
        /* Build a map (floor(time) -> listof<happiness_value>)
           and find maximum value of timestamp. */
        for (var i = 0; i < reactions.length; i++) {
            var time = parseInt(reactions[i].time);
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
                }
                tolerateCount = 0;
            }
            else {
                if (isHighlight) {
                    tolerateCount += 1;
                    if (tolerateCount > 3) {
                        isHighlight = false;
                        regionEndIndex = i;

                    }
                }
            }
        }
    });
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
