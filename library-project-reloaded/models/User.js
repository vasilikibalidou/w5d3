const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  password: String,
  githubId: String
});

const User = mongoose.model("User", userSchema);

module.exports = User;
