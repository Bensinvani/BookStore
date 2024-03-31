const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    // connect to Database
    try {
        const mongoURI = process.env.MONGO_URI; // Fetch MongoDB URI from environment variables

        if (!mongoURI) {
            console.error("MongoDB URI is not provided in the environment variables.");
            process.exit(1);
        }

        const connection = await mongoose.connect(mongoURI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });

        console.log(`Mongo connected: ${connection.connection.host}`.cyan.underline);
    } catch (error) {
        console.error(`Mongo not connected, error: ${error.message}`.red.underline.bold);
        process.exit(1);
    }
}

module.exports = connectDB;
