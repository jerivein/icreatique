// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
mongoose.connect('mongodb://admin:admin@ds239968.mlab.com:39968/besteats'); // connect to our database
var path = require('path');

var Restaurant = require('./models/restaurant');
var MenuItem = require('./models/menuItem');
var Review = require('./models/review');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

// more routes for our API will happen here

router.route('/restaurants')
      .get(function(req, res) {
        Restaurant.find(function(err, restaurants) {
	  if (err) {
            res.send(err);
	  }
	  res.json(restaurants);
	});
      });

var viewRouter = express.Router();
app.set('views', './views');
app.set('view engine', 'pug');
app.use("/styles", express.static(__dirname + '/styles'));
app.use("/images", express.static(__dirname + '/images'));

viewRouter.use(function(req, res, next){
  console.log(req.originalUrl);
  next();
});

viewRouter.get('/about', function(req, res){
    res.render('about', {});
});

viewRouter.get('/status', function(req, res){
    res.render('status', {});
});

viewRouter.get('/activities', function(req, res){
    res.render('activities', {});
});

viewRouter.get('/info', function(req, res){
    res.render('info', {});
});

viewRouter.get('/', function(req, res){
  res.redirect('/restaurants');
});

viewRouter.route('/restaurants')
.get(function(req, res){
  Restaurant.find(function(err, restaurants) {
    if (err) {
      res.send(err);
    }
    res.render('index', { restaurants: restaurants });
  });
})
.post(function(req, res) {
    var restaurant = new Restaurant();
    restaurant.name = req.body.name;

    restaurant.save(function(err) {
      if (err) {
        res.send(err);
      }
    });
});

viewRouter.route('/restaurants/:restaurant_id')
.get(function(req, res){
  Restaurant.findById(req.params.restaurant_id, function(err, restaurant){
    if (err) {
      res.send(err);
    }
    res.render('restaurant', { restaurant: restaurant })
  });
}).post(function(req, res) {
  Restaurant.findById(req.params.restaurant_id, function(err, restaurant){
    menuItem = new MenuItem();
    menuItem.name = req.body.name;
    restaurant.menuItems.push(menuItem);
    restaurant.save(function(err) {
      if (err) {
        res.send(err);
      }
      res.redirect(req.originalUrl);
    });
  });
});

viewRouter.route('/restaurants/:restaurant_id/:food_id')
.get(function(req, res){
  Restaurant.findById(req.params.restaurant_id, function(err, restaurant){
    if (err) {
      res.send(err);
    }
    var food = restaurant.menuItems.id(req.params.food_id);
    res.render('food', { restaurant: restaurant, food: food, current_url: req.originalUrl})
  });
}).post(function(req, res) {
  Restaurant.findById(req.params.restaurant_id, function(err, restaurant){
    review = new Review();
    review.name = req.body.name;
    review.stars = req.body.stars;
    review.comment = req.body.comment;
    restaurant.menuItems.id(req.params.food_id).ratings.push(review);
    restaurant.save(function(err) {
      if (err) {
        res.send(err);
      }
      res.redirect(req.originalUrl);
    });
  });
});



// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use('/', viewRouter);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
