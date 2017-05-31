var express = require('express');
var router = express.Router();
var request = require('request');

var mongoose = require('mongoose');

var Highlight = require('../models/Highlight');

/*
 * GET highlight info
 * Query: video_id (?video_id=xxxxx)
 */
router.get('/', function(req, res, next) {
    generate_highlight();
    Highlight.findOne({
        video_id: req.query.video_id
    }).
    exec(function (err, highlight) {
        if (err) return console.log(err);
        res.send(highlight);
    });
});

function generate_highlight() {

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
