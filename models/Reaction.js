var mongoose = require('mongoose');
var Float = require('mongoose-float').loadType(mongoose);
var Schema = mongoose.Schema;

var reactionSchema = new Schema({
  video_id: {type: String, required: true},
  user_id: {type: String, required: true},
  time: {type: Number, required: true},
  happiness: {type: Float, required: true},
  neutral: {type: Float, required: true},
});

var Reaction = mongoose.model('reaction', reactionSchema, 'reaction');

module.exports = Reaction;
