const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");

router.get("/signup", (req, res, next) => {
  res.render("signup.hbs");
});

router.get("/login", (req, res) => {
  res.render("login.hbs", { errorMessage: req.flash("error") });
});

router.get("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/");
});

const passport = require("passport");

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
  })
);

router.post("/signup", (req, res, next) => {
  // const username = req.body.username;
  // const password = req.body.password;
  const { username, password } = req.body;

  if (!username) {
    res.render("signup.hbs", {
      errorMessage: "Username cannot be empty"
    });
    return;
  }
  if (password.length < 6) {
    res.render("signup.hbs", {
      errorMessage: "Password must be 6 char. min"
    });
    return;
  }

  // User.findOne({ username });
  User.findOne({ username: username })
    .then(user => {
      if (user) {
        res.render("signup.hbs", {
          errorMessage: "Username already taken"
        });
        return;
      }

      bcrypt
        .hash(password, 10)
        .then(hash => {
          return User.create({ username: username, password: hash });
        })
        .then(createdUser => {
          req.login(createdUser, err => {
            if (err) {
              next(err);
              return;
            }
            res.redirect("/");
          });
        });
    })
    .catch(err => {
      next(err);
    });
});

router.get("/github", passport.authenticate("github"));

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/",
    successRedirect: "/"
  })
);

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

module.exports = router;
