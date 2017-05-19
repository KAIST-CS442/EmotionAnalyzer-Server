var express = require('express');
var router = express.Router();
var request = require('request');

var mongoose = require('mongoose');

var Highlight = require('../models/Highlight');

router.get('/', function(req, res, next) {
  Highlight.findOne({
    video_id: req.query.video_id
  }).
  exec(function (err, highlight) {
    if (err) return console.log(err);
    res.send(highlight);
  });
});

module.exports = router;
