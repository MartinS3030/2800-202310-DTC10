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


// SIGN UP PAGE
app.get('/signup', (req,res) => {
    res.render('signup', { stylesheetPath: './styles/login.css' })
});

// SIGN UP SUBMIT PAGE
app.post('/signupSubmit', async (req, res) => {
    const schema = joi.object({
        username: joi.string().required(),
        name: joi.string().required(),
        email: joi.string().email().required(),
        password: joi.string().required(),
        dob: joi.string().required()
    })
    try {
        const validation = await schema.validateAsync({ name: req.body.name, email: req.body.email, password: req.body.password, username: req.body.username, dob: req.body.dob })
        const { username, name, email, password, dob } = req.body;
        const result = await userModel.find({
            email: email
        })
        if (result.length > 0) {
            res.render('signupSubmit.ejs', { error: 'already exists' })
        } else {
            const user = new userModel({
                username: username,
                name: name,
                email: email,
                password: bcrypt.hashSync(password, 12),
                type: 'user',
                wishlist: [],
                favourites: [],
                history: [],
                dob: dob
            })
            await user.save()
            req.session.GLOBAL_AUTHENTICATION = true
            req.session.name = name
            req.session.type = 'user'
            req.session.cookie.maxAge = expireTime
            res.redirect('/profile')
        }
    } catch (error) {
        res.render('signupSubmit.ejs', { error: 'invalid', name: req.body.name, email: req.body.email, password: req.body.password })
    }
})


// LOGIN PAGE
app.get('/login', (req, res) => {
    res.render('login', { stylesheetPath: '/path/to/stylesheet.css' })
})

// LOGIN SUBMIT PAGE
app.post('/loginSubmit', async (req, res) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    })
    try {
        const validation = await schema.validateAsync({ email: req.body.email, password: req.body.password })
        const result = await userModel.find({
            email: req.body.email
        })
        if (result.length == 0) {
            res.render('loginSubmit.ejs')
        } else if (bcrypt.compareSync(req.body.password, result[0].password)) {
            req.session.GLOBAL_AUTHENTICATION = true
            req.session.name = result[0].name
            req.session.type = result[0].type
            req.session.cookie.maxAge = expireTime
            res.redirect('/profile')
        } else {
            res.render('loginSubmit.ejs')
        }
    } catch (error) {
        res.redirect('/login')
    }
})



app.get('/profile', (req, res) => {
    res.render('profile', { stylesheetPath: '/path/to/stylesheet.css' })
})

app.post('/loginSubmit', async (req, res) => {

})

module.exports = app