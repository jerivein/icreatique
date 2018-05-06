var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var Review = require('./review');

var MenuItemSchema = new Schema({
    name: String,
    ratings: [Review.schema]
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
