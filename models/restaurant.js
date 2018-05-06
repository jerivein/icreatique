var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var MenuItem = require('./menuItem');

var RestaurantSchema = new Schema({
    name: String,
    menuItems: [MenuItem.schema]
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
