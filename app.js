const express = require('express');
const app = express();
const session = require('express-session');
const firebase = require('firebase');
const firebaseConfig = require('./firebseConfig');
const passport = require('passport');
const data= require('./data')
// Initialize Firebase
app.set("view engine",'ejs')
firebase.initializeApp(firebaseConfig);
app.use(express.static('public'))
app.use('/scripts', express.static(__dirname + '/node_modules/firebase/'))
app.use(express.urlencoded({extended:false}))
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET' 
}))
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, cb) {
  cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

/*  Google AUTH  */
 
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = '832147124434-do89hue233ffq6gk8qv1b1j0c9fhsi5g.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
  }
));

// facebook OAuth
const FacebookStrategy = require('passport-facebook').Strategy
const FACEBOOK_CLIENT_ID="523858029876670"
const FACEBOOK_CLIENT_SECRET="a67b46473c782667cbd06022d505f80e"
passport.use(new FacebookStrategy({
  clientID: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback"
},
function(accessToken, refreshToken, profile, cb) {
  // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
  //   return cb(err, user);
  // });
  userProfile=profile;
  return cb(null, userProfile);
  console.log(profile)
}
));

// Set up middleware for Firebase authentication
const authMiddleware = (req, res, next) => {
  const user = firebase.auth().currentUser;

  if (user) {
    req.user = user;
    next();
  } else {
    res.redirect('/login');
  }
};

 app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });
  
  // app.get('*', (req, res) => {
  //   res.render('layout',{});
  // });
    

  app.get('/success', (req, res) => res.redirect('/'));
  app.get('/error', (req, res) => res.redirect("/login"));
  

// Set up routes for authentication
app.get('/login', (req, res) => {
  // res.render('login.ejs');
  if(req.user) res.redirect("/")
  else
  res.render('layout',{body:'login'});
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/success');
  });

app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] }));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
  });


app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(email,password,"hello")

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      req.login({email,password}, function(err) {
        if (err) { return next(err); }
        return res.redirect('/');
      });
    })
    .catch((error) => {
      console.error(error);
      res.redirect('/login');
    });
});

app.get('/register', (req, res) => {
  // res.render('register.ejs');
  res.render('layout',{body:'register.ejs'});
});

app.post('/register', (req, res) => {
  console.log(req.body)
  const email = req.body.email;
  const password = req.body.password;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      res.redirect('/');
    })
    .catch((error) => {
      console.error(error);
      res.redirect('/register');
    });
});
app.get('/dashboard', (req, res) => {
  // TODO: Add logic for fetching data to display on the dashboard
  res.render('layout', { body:'dashboard',title: 'Dashboard' });
});


// Set up route for live canteen status
app.get('/', (req, res) => {
    // Retrieve live canteen status data from Firebase database
    // const itemsRef = firebase.database().ref('items');
    // itemsRef.on('value', (snapshot) => {
    //   const items = snapshot.val();
    //   res.render('live-canteen', { items });
      
    // }, (error) => {
    //   console.log('Error fetching live canteen status data: ', error);
    //   // res.render('live-canteen', { items: [] });
    console.log(req.session)
  //   data.push({
  //     name :"Cafe1",
  // })
    if(req.session?.passport?.user)
      res.render('layout',{body:'live-canteen',items: data});
      else res.redirect('/login')
    // });
  });
  app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  });
 

// Start the server
app.listen(3000, () => {
console.log('Server started on port 3000');
});
