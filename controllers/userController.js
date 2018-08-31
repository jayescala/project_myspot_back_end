const express = require('express');
const bcrypt = require("bcrypt");
const router = express.Router();
const Users = require('../models/users.js');


// User Register
router.post("/register", async (req, res) => {
  try {
    const userEntry = {};
    const username = req.body.username;
    const password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));

    userEntry.username = username;
    userEntry.password = password;

    const registerUsername = await Users.findOne({username: req.body.username});

    if(registerUsername !== true){
      await Users.create(userEntry, (err, user) => {
        req.session.username = userEntry.username;
        req.session.loggedIn = true;
        req.session.message = "You are already logged in.";
        res.json({
          status: 200,
          data: req.session
        });
      });
    } else {
      req.session.message = "The username you had entered is already in use.";
      res.json({
        status: 200,
        data: req.session
      });
    }
  } catch(err) {
    console.log(err);
    res.send(err);
  }
});

// User Login
router.post('/login', async (req, res) => {
  req.session.username = "";
  req.session.loggedIn = false;
  req.session.message = "";
  await Users.findOne({username: req.body.username}, (err, loginUsername) => {
    if(loginUsername){
      if(bcrypt.compareSync(req.body.password, loginUsername.password)){
        req.session.username = req.body.username;
        req.session.loggedIn = true;
        req.session.message = "You are already logged in.";
      } else {
        req.session.message = "The password you have entered is incorrect.";
      }
    } else {
      req.session.message = "The username you had entered does not match any existing accounts.";
    }
  });
  res.json({
    status: 200,
    data: req.session
  });
});

// User Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if(err){
      res.send(err, "Error destroying session");
    } else {
      req.session.message = "";
    }
    res.json({
      status: 200,
      data: "login successful"
    });
  });
});

module.exports = router;
