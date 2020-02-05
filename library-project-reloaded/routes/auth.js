const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");

router.get("/signup", (req, res, next) => {
  res.render("signup.hbs");
});

router.get("/login", (req, res) => {
  res.render("login.hbs");
});

router.get("/logout", (req, res, next) => {
  req.session.destroy(err => {
    if (err) next(err);
    res.redirect("/");
  });
});

router.post("/login", (req, res, next) => {
  // const username = req.body.username;
  // const password = req.body.password;
  const { username, password } = req.body;

  let user;

  // User.findOne({ username: req.body.username })
  User.findOne({ username: username })
    .then(foundUser => {
      // if (foundUser === null)
      if (!foundUser) {
        res.render("signup.hbs", {
          errorMessage: "Invalid credentials"
        });
        return;
      }

      user = foundUser;

      return bcrypt.compare(password, foundUser.password);
    })
    .then(match => {
      if (!match) {
        res.render("signup.hbs", { errorMessage: "Invalid credentials" });
        return;
      }
      // log user in

      // {"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"foo":{"_id":"5e3a78fa86c5cdcaebc8e80e","username":"user42","password":"$2b$10$CBqx55h.vIi6GtLUf2qGJeVXRGjbzEDT3LOwD0PwYzsI3V7EksInS","__v":0}}

      req.session.user = user;
      res.redirect("/");
    })
    .catch(err => {
      next(err);
    });
});

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
          console.log(createdUser);

          req.session.user = createdUser;
          res.redirect("/");
        });
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
