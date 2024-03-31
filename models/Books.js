const mongoose = require('mongoose');

const BooksSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true // Name is required
    },
    author: {
        type: String,
        required: true // Author is required
    },
    isExist: {
        type: Boolean,
        default: true // Defaults to true, indicating the book exists in the library
    },
    createdDate: {
        type: Date,
        default: Date.now // Automatically sets to the current date
    },
    borrowDate: {
        type: Date,
        required: false // This can be optional, as not all books might be borrowed immediately
    },
    imageUrl : {
        type:String,
        required: false
    }
});

const Books = mongoose.model('Book', BooksSchema);
exports.Books = Books;
