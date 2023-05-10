const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const userModel = require('./models/user')
const bcrypt = require('bcrypt')
const joi = require('joi')
const app = express()
const multer = require('multer');
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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Define the destination folder where uploaded files will be stored
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); // Use the original file name as the stored file name
    }
  });

const upload = multer({ storage: storage });

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

app.post('/upload', upload.single('profilePicture'), async (req, res) => {
    // Handle the uploaded file here
    const file = req.file;
    if (!file) {
      // If no file was uploaded, handle the error
      res.status(400).send('No file uploaded');
    } else {
      // File was uploaded successfully, process it
      // Access the file properties using file.fieldname, file.originalname, file.path, etc.
      
      try {
        // Find the user in the user collection based on their name or any unique identifier
        const user = await userModel.findOne({ name: req.session.name });
  
        if (!user) {
          // Handle the case where the user does not exist
          res.status(404).send('User not found');
          return;
        }
  
        // Update the user's profile picture field with the file information
        user.profilePicture = {
          filename: file.originalname,
          path: file.path,
          // Add other relevant properties if needed
        };
  
        // Save the updated user object back to the database
        await user.save();
  
        res.send('File uploaded successfully');
      } catch (error) {
        // Handle any errors that occurred during the database operation
        console.error(error);
        res.status(500).send('Internal server error');
      }
    }
  });

module.exports = app