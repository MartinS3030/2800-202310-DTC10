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


// SIGN UP PAGE
app.get('/signup', (req,res) => {
    res.render('signup', { stylesheetPath: ['./styles/login.css'] })
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
            req.session.email = email
            req.session.type = 'user'
            req.session.cookie.maxAge = expireTime
            res.redirect('/profile')
        }
    } catch (error) {
        res.render('signupSubmit.ejs', { error: 'invalid', name: req.body.name, email: req.body.email, password: req.body.password })
    }
})

app.post('/securityQuestion', async (req, res) => {
    const email = req.session.email;
    const user = await userModel.findOne({ email: email });
    res.render('securityQuestion');

})


// LOGIN PAGE
app.get('/login', (req, res) => {
    res.render('login', { stylesheetPath: ['/styles/login.css'] })
})
app.get("/", (req, res) => {
  res.render("index" , { stylesheetPath: 'styles/index.css' });
});
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
            req.session.email= result[0].email
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

app.get('/profile', async (req, res) => {
    const email = req.session.email;
    const result = await userModel.find({email: email});
    const username = result[0].username;
    const name = result[0].name;
    const dob = result[0].dob;
    res.render('profile', { username: username, name: name, email: email, dob: dob, stylesheetPath: './styles/profile.css' })
})

app.post('/updateInfo', async (req, res) => {
    // Retrieve the user's session name
    const email = req.session.email;
  
    // Retrieve the user's entered values from the form
    const updatedName = req.body.name;
    const updatedUsername = req.body.username;
    const updatedEmail = req.body.email;
    const updatedDob = req.body.dob;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
  
    // Fetch the user document from the database
    const user = await userModel.findOne({ email: email });
  
    // Check if the user exists
    if (user) {
      console.log(user.name)
  
      // Update the fields if they are changed
      if (updatedName !== user.name) {
        await userCollection.updateOne({
            email: email
        }, {
            $set: {
                name: updatedName
            }
        });
      }
  
      if (updatedUsername !== user.username) {
        await userCollection.updateOne({
            email: email
        }, {
            $set: {
                username: updatedUsername
            }
        });
      }
  
      if (updatedDob !== user.dob) {
        await userCollection.updateOne({
            email: email
        }, {
            $set: {
                dob: updatedDob
            }
        });
      }

      const result = await userModel.find({
        email: email,
    })
    if (result.length == 0) {
        res.render('loginSubmit.ejs')
    } else if (bcrypt.compareSync(confirmPassword, result[0].password)) {
        console.log("passwords match")
        if (newPassword !== user.password) {
            await userCollection.updateOne({
                email: email
            }, {
                $set: {
                    password: bcrypt.hashSync(newPassword, 12)
                }
            });
        }
    }
  
      // Redirect or respond with a success message
      return res.redirect('/profile');
    }
  
    // Handle the case if the user does not exist
    return res.status(404).send('User not found');
  });

  app.get('/wishlist', async (req, res) => {
    const email = req.session.email;
    const result = await userModel.find({email: email});
    const stylesheets = ['/styles/wishlist.css']
    res.render('wishlist', { wishlist: result[0].wishlist, stylesheetPath: stylesheets })
})
  

module.exports = app