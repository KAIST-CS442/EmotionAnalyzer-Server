var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var highlightSchema = new Schema({
  video_id: {type: String, required: true, index: true},
  start: {type: Number, required: true, index: true},
  end: {type: Number, required: true, index: true},
  highlight_url: {type: String, required: true},
  thumbnail_url: {type: String, required: true},
  video_name: {type: String, required: true}
});
highlightSchema.index({video_id: 1, start: 1, end: 1}, {unique: true});

var Highlight = mongoose.model('highlight', highlightSchema, 'highlight');

module.exports = Highlight;
