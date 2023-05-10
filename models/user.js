const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    type: String,
    wishlist: Array,
    favourites: Array,
    history: Array,
    dob: String,
    profilePicture: {
      filename: String,
      path: String,
    }
  });

const User = mongoose.model('users', userSchema)

module.exports = User