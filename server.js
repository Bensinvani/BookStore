const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const connectDB = require('./config/db.js');
const booksRoute = require('./routes/books');
const userRoute = require('./routes/users');

//import dotenv
dotenv.config();

//call to port
const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json()); // for parsing application/json


// Parse JSON bodies
app.use(bodyParser.json());


// Define routes
app.use('/api/books', booksRoute);
app.use('/api/users', userRoute);


// Connect to the database
connectDB();

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
