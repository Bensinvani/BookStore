const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        maxLength: 10,
        unique: true,
    },
    passwordHash: {
        type: String,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book' // This assumes you have a Book model defined elsewhere
    }],
});

const User = mongoose.model("Users", UserSchema);
exports.User = User;


