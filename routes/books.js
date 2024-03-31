const express = require("express");
const router = express.Router();
const { Books } = require("../models/Books")
const { User } = require("../models/User")

// Combined GET route for "/books" to display the form and list all books
router.get("/books", async (req, res) => {
    try {
        const books = await Books.find().lean();
        // The "books" variable is passed to the template to be rendered
        res.render("Book", { books });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE route for adding new books via POST request
router.post("/api/books", (req, res) => {
    const { name } = req.body;
    console.log(`Attempting to create a book with the name: ${name}`);

    Books.create(req.body)
        .then(newBook => {
            console.log(`Successfully created a book with the name: ${name}`);
            // Redirect to "/books" after successfully creating a new book
            res.redirect("/books");
        })
        .catch(error => {
            console.error(`Error creating a book with the name: ${name}`, error);
            res.status(500).json({ error: error.message });
        });
});

// Route to fetch 3 random recommended books for the index page
router.get("/", async (req, res) => {
    try {
        const recommendedBooks = await Books.aggregate([
            { $sample: { size: 3 } }
        ]).exec();
        res.render("index", { recommendedBooks: recommendedBooks });
    } catch (error) {
        console.error('Error fetching recommended books:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to fetch all books via API
router.get("/api/books", async (req, res) => {
    try {
        const books_getall = await Books.find().lean();
        res.status(200).json({books_getall});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// route to search books
router.get("/books/search", async (req, res) => {
    try {
        const searchQuery = req.query.query;
        const books = await Books.find({ 
            name: { $regex: new RegExp(searchQuery, 'i') } // Case-insensitive search
        }).lean();
        
        // Render the same Books.hbs template with the search results
        res.render("Book", { books });
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ single book route
router.get("/api/books/:id", async (req, res) => {
    try {
        const book = await Books.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// route for borrowing a book
router.post("/books/borrow", async (req, res) => {
    const { bookId, userEmail } = req.body; // Use userEmail from the form

    try {
        const book = await Books.findById(bookId);
        const user = await User.findOne({ email: userEmail }); // Find user by email

        if (!book || !user) {
            return res.status(404).send("Book or User not found.");
        }

        if (book.isExist) {
            const newBorrowDate = new Date();
            newBorrowDate.setDate(newBorrowDate.getDate() + 3); // Set the return date

            // Update the book as borrowed
            await Books.findByIdAndUpdate(bookId, { isExist: false, borrowDate: newBorrowDate });
            // Add the book to the user's borrowed books
            await User.findByIdAndUpdate(user._id, { $push: { books: book._id } });

            res.redirect("/books"); // Redirect back to the books list
        } else {
            res.status(400).send("This book is currently not available for borrowing.");
        }
    } catch (error) {
        console.error(`Error borrowing the book: ${error}`);
        res.status(500).send(error.message);
    }
});

// route for returning a book
router.post("/books/return", async (req, res) => {
    const { bookId, userEmail } = req.body;
    console.log(req.body)

    try {
        // Find the book and user
        const book = await Books.findById(bookId);
        const user = await User.findOne({ email: userEmail });

        if (!book || !user) {
            return res.status(404).send("Book or User not found.");
        }

        // Return the book
        await Books.findByIdAndUpdate(bookId, { isExist: true });

        // Remove the book from the user's borrowed books
        await User.findByIdAndUpdate(user._id, { $pull: { books: bookId } });

        // Redirect or send a success message
        res.redirect("/books"); // or res.send("Book returned successfully.");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while returning the book.");
    }
});


// takeing a book and adding it to the user's books array
router.post("/api/books/takeBook/:id", async (req, res) => {
    const bookId = req.params.id;
    const userId = req.body.userId; // Assuming the user's ID is sent in the body of the request

    try {
        const book = await Books.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        if (book.isExist) {
            const newBorrowDate = new Date();
            newBorrowDate.setDate(newBorrowDate.getDate() + 3); // Add 3 days to the current date

            // Update book's availability
            const updatedBook = await Books.findByIdAndUpdate(bookId, { isExist: false, borrowDate: newBorrowDate }, { new: true });

            // Add the book to the user's books array
            const updatedUser = await User.findByIdAndUpdate(userId, { $push: { books: bookId } }, { new: true });

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({
                message: "You can take this book. The book's availability has been updated, and the book has been added to your list.",
                updatedBook,
                user: updatedUser
            });
        } else {
            res.status(400).json({ message: "You can't take this book as it's currently not available." });
        }
    } catch (error) {
        console.error(`Error in takeBook route with the ID: ${bookId}`, error);
        res.status(500).json({ error: error.message });
    }
});



router.post("/api/books/releaseBook/:id", async (req, res) => {
    const bookId = req.params.id;

    console.log("bookId: " + bookId)

    try {
        const book = await Books.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Update book's availability to true
        const updatedBook = await Books.findByIdAndUpdate(bookId, { isExist: true }, { new: true });
        console.log("Updated Book:", updatedBook);

        // Remove the book ID from the user's books array
        const updatedUser = await User.findOneAndUpdate({ books: bookId }, { $pull: { books: bookId } }, { new: true });
        console.log("Updated User:", updatedUser);

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found or book was not borrowed by any user" });
        }

        res.status(200).json({
            message: "The book has been released and is now available for borrowing.",
            updatedBook,
            updatedUser
        });
    } catch (error) {
        console.error(`Error in releaseBook route with the ID: ${bookId}`, error);
        res.status(500).json({ error: error.message });
    }
});



// UPDATE route
router.put("/api/books/:id", async (req, res) => {
    try {
        // Destructure imageUrl from req.body and prepare an update object.
        // This ensures only imageUrl can be updated via this route.
        const { imageUrl } = req.body;
        const update = {};

        // If imageUrl is provided in the request, add it to the update object.
        if (imageUrl) {
            update.imageUrl = imageUrl;
        }

        // Perform the update operation with the specified update object.
        const updatedBook = await Books.findByIdAndUpdate(req.params.id, update, { new: true });

        // Check if the book was found and updated
        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Respond with the updated book
        res.json(updatedBook);
    } catch (error) {
        // Handle any errors
        res.status(500).json({ error: error.message });
    }
});

// DELETE route
router.delete("api/books/:id", async (req, res) => {
    try {
        const deletedBook = await Books.findByIdAndDelete(req.params.id);
        if (!deletedBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
