var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var highlightSchema = new Schema({
  video_id: {type: String, required: true},
  start: {type: Number, required: true},
  end: {type: Number, required: true}
});

var Highlight = mongoose.model('highlight', highlightSchema, 'highlight');

module.exports = Highlight;
