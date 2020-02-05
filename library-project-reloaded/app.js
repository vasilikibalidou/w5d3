require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");

mongoose
  .connect("mongodb://localhost/library-project-reloaded", {
    useNewUrlParser: true
  })
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

app.use(
  session({
    cookie: {
      maxAge: 24 * 60 * 60 * 1000
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

app.use(passport.initialize());
app.use(passport.session());

const flash = require("connect-flash");
app.use(flash());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

const User = require("./models/User");

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(userDocument => {
      done(null, userDocument);
    })
    .catch(err => {
      done(err);
    });
});

const bcrypt = require("bcrypt");

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username })
      .then(userDocument => {
        console.log(userDocument);
        if (!userDocument) {
          done(null, false, { message: "Incorrect credentials" });
          return;
        }
        bcrypt.compare(password, userDocument.password).then(match => {
          if (!match) {
            done(null, false, { message: "Incorrect credentials" });
            return;
          }
          done(null, userDocument);
        });
      })
      .catch(err => {
        done(err);
      });
  })
);

const GithubStrategy = require("passport-github").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/github/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ githubId: profile.id })
        .then(userDocument => {
          if (userDocument) {
            done(null, userDocument);
          } else {
            return User.create({ githubId: profile.id }).then(createdUser => {
              done(null, createdUser);
            });
          }
        })
        .catch(err => {
          done(err);
        });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ facebookId: profile.id })
        .then(userDocument => {
          if (userDocument) {
            done(null, userDocument);
          } else {
            return User.create({ facebookId: profile.id }).then(createdUser => {
              done(null, createdUser);
            });
          }
        })
        .catch(err => {
          done(err);
        });
    }
  )
);

// Express View engine setup

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// default value for title local
app.locals.title = "Library Project";

const index = require("./routes/index");
app.use("/", index);

const bookRoutes = require("./routes/books");
app.use("/", bookRoutes);

const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

module.exports = app;
