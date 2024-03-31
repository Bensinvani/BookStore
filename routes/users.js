// Required imports
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User } = require("../models/User");
const { body, validationResult } = require('express-validator');
const { generateToken } = require('../config/jwt');
const hbs = require('express-handlebars');

//
router.get('/users', async (req, res) => {
  try {
      // Fetch all users and populate their borrowed books
      const users = await User.find()
                              .populate('books', 'name borrowDate') // Populate only the name and borrowDate fields from the Books model
                              .lean(); // Convert to JavaScript objects for Handlebars

      // Render the 'users.hbs' template with the populated users data
      res.render('users', { users });
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: error.message });
  }
});

// GET request for the registration page
router.get('/register', (req, res) => {
    let message = req.session.registrationMessage || '';
    req.session.registrationMessage = ''; // Clear the message after it's displayed
    res.render('register', { layout: 'main', message: message });
});

// Modified POST route for user registration
router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),
    body('phone').isLength({ max: 10 }) // Validate phone number length if provided
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        req.session.registrationMessage = 'User already exists';
        return res.redirect('/register');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      user = new User({
        email,
        phone, // Include phone in the new user creation
        password: passwordHash
      });

      await user.save();

      req.session.registrationMessage = 'Thank you for signing up! You can now log in.';
      res.redirect('/login');
    } catch (error) {
      req.session.registrationMessage = error.message;
      res.redirect('/register');
    }
  }
);


// GET request for the login page
router.get('/login', (req, res) => {
    let message = req.session.registrationMessage || '';
    let error = req.session.loginError || '';
    req.session.registrationMessage = ''; // Clear the message after displaying it
    req.session.loginError = ''; // Clear the error after displaying it
    res.render('login', { layout: 'main', message: message, error: error });
});

// User login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && bcrypt.compareSync(password, user.password)) {
      await User.findByIdAndUpdate(user._id, { isConnected: true, lastActive: new Date() });
      // Set user info in session, excluding the password
      req.session.user = { id: user._id, email: user.email };
      res.redirect('/'); // Redirect to home or dashboard
  } else {
      req.session.loginError = "Invalid credentials";
      res.redirect('/login');
  }
});

// Logout route
router.get('/logout', async (req, res) => {
  if (req.session.user) {
    await User.findByIdAndUpdate(req.session.user.id, { isConnected: false });
    req.session.destroy(() => {
      res.redirect('/'); // Redirect to the home page or login page
    });
  } else {
    // Handle the case where the session or user doesn't exist
    res.redirect('/login');
  }
});




// route to fetch all the users from the data base
router.get('/users', async (req, res) => {
    try {
        // Fetch all users from the database, excluding their passwords
        const users = await User.find().select('-password').lean();
        // Render the 'users.hbs' template with the users data
        res.render('users', { users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Fetching a user by ID route
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password from the result
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Updating user details route
router.put('/:id', async (req, res) => {
    const { email, phone, password } = req.body;
  
    try {
      let update = {};
      if (email) update.email = email;
      if (phone) update.phone = phone;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(password, salt);
      }
  
      const updatedUser = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password').lean();
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});
  

// Deleting a user route
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User successfully deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export the router
module.exports = router;
