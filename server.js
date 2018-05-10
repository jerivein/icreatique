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

var User = require('../models/user');
var mid = require('../middleware');

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

// GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId)
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          return res.render('profile', { title: 'Profile', name: user.name, favorite: user.favoriteBook });
        }
      });
});

// GET /logout
router.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

// GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
  return res.render('login', { title: 'Log In'});
});

// POST /login
router.post('/login', function(req, res, next) {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      }  else {
        req.session.userId = user._id;
        return res.redirect('/profile');
      }
    });
  } else {
    var err = new Error('Email and password are required.');
    err.status = 401;
    return next(err);
  }
});

// GET /register
router.get('/register', mid.loggedOut, function(req, res, next) {
  return res.render('register', { title: 'Sign Up' });
});

// POST /register
router.post('/register', function(req, res, next) {
  if (req.body.email &&
    req.body.name &&
    req.body.favoriteBook &&
    req.body.password &&
    req.body.confirmPassword) {

      // confirm that user typed same password twice
      if (req.body.password !== req.body.confirmPassword) {
        var err = new Error('Passwords do not match.');
        err.status = 400;
        return next(err);
      }

      // create object with form input
      var userData = {
        email: req.body.email,
        name: req.body.name,
        favoriteBook: req.body.favoriteBook,
        password: req.body.password
      };

      // use schema's `create` method to insert document into Mongo
      User.create(userData, function (error, user) {
        if (error) {
          return next(error);
        } else {
          req.session.userId = user._id;
          return res.redirect('/profile');
        }
      });

    } else {
      var err = new Error('All fields required.');
      err.status = 400;
      return next(err);
    }
})

// GET /
router.get('/', function(req, res, next) {
  return res.render('index', { title: 'Home' });
});

// GET /about
router.get('/about', function(req, res, next) {
  return res.render('about', { title: 'About' });
});

// GET /contact
router.get('/contact', function(req, res, next) {
  return res.render('contact', { title: 'Contact' });
});





// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use('/', viewRouter);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
