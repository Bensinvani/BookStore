const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensures email uniqueness within the database
    },
    phone: {
        type: String,
        maxLength: 10,
    },
    password: {
        type: String,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    isConnected: {
        type: Boolean,
        default: false, // Assume users are not connected by default
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book' // This assumes you have a Book model defined elsewhere
    }],
    lastActive: {
        type: Date,
        default: Date.now,
    },
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },
    twitterId: { type: String, default: null },
    // Consider adding a field to indicate the type of user: local or social
    userType: { type: String, enum: ['local', 'google', 'facebook', 'twitter'], required: true, default: 'local' },
});

const User = mongoose.model("Users", UserSchema);
exports.User = User;


