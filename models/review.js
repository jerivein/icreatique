var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ReviewSchema = new Schema({
    name: String,
    stars: Number,
    comment: String
});

module.exports = mongoose.model('Review', ReviewSchema);
