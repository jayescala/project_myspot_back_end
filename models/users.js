// Imports
const mongoose = require("mongoose");

// Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  accessToken: String,
  refreshToken: String
});

module.exports = mongoose.model("User", userSchema);
