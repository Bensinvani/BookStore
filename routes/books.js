const express = require("express");
const router = express.Router();
const { Books } = require("../models/Books")

const { User } = require("../models/User")

// CREATE route
router.post("/", (req, res) => {
    const { name } = req.body;
    console.log(`Attempting to create a book with the name: ${name}`);

    Books.create(req.body)
        .then(newBook => {
            console.log(`Successfully created a book with the name: ${name}`);
            res.status(201).json(newBook);
        })
        .catch(error => {
            console.error(`Error creating a book with the name: ${name}`, error);
            res.status(500).json({ error: error.message });
        });
});


// READ all books route
router.get("/", async (req, res) => {
    try {
        const books = await Books.find();
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// READ single book route
router.get("/:id", async (req, res) => {
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

router.post("/takeBook/:id", async (req, res) => {
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



router.post("/releaseBook/:id", async (req, res) => {
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
router.put("/:id", async (req, res) => {
    try {
        const updatedBook = await Books.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBook) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE route
router.delete("/:id", async (req, res) => {
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
