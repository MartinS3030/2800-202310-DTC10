const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const userModel = require('./models/user')
const bcrypt = require('bcrypt')
const joi = require('joi')
const app = express()
require('dotenv').config();
require("./utils.js");

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'));
app.set('view engine', 'ejs')
const expireTime = 1000 * 60 * 60

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

var {
    database
} = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({
    extended: false
}));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}));

app.get('/', (req, res) => {
    res.send('Hello World!')

})

app.get('/profile', (req, res) => {
    res.render('profile')
})

module.exports = app