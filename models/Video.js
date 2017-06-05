var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var videoSchema = new Schema({
  video_id: {type: String, required: true, unique: true},
  video_name: {type: String, required: true},
});

var Video = mongoose.model('video', videoSchema, 'video');

module.exports = Video;
