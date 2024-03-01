const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models/User")


// Assuming this is in a file where you've already set up express and router

router.post('/', async (req, res) => {
    console.log(req.body); // Log to see what's inside req.body
    const { phone, password } = req.body;

    // Check if the phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
        return res.status(400).json({ message: "Phone already in use." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log(`Password hash: ${passwordHash}`)

    // Create a new user
    try {
        const newUser = new User({
            phone,
            passwordHash
        });

        const savedUser = await newUser.save();

        // Instead of generating and returning a JWT, return a success message
        res.status(201).json({ message: "User successfully created." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});





router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.put('/users/:id', async (req, res) => {
    const { phone } = req.body;

    // Optional: Add logic to hash a new password if password change is required

    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, { phone }, { new: true });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User successfully deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
