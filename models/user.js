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
    security_question: String,
    security_answer: String,
    profilePic: String,
    promptsArray: Array,
    answersArray: Array,
    gamingPlatform: String,
    gamingId: String,
})

const User = mongoose.model('users', userSchema)

module.exports = User