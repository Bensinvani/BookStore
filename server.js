// Server setup and middleware configuration

// Import necessary modules
const morgan = require('morgan'); // Logs request details
const express = require('express'); // Core framework
const dotenv = require('dotenv'); // Manages environment variables
const bodyParser = require("body-parser"); // Parses incoming request bodies
const connectDB = require('./config/db.js'); // Database connection setup
const booksRoute = require('./routes/books'); // Route for books
const userRoute = require('./routes/users'); // Route for users
const { engine } = require('express-handlebars'); // Template engine for views
const cron = require('node-cron'); // Scheduler for tasks
const { User } = require('./models/User'); // User model for database operations
const passport = require('passport'); // Authentication framework
const cors = require('cors'); // Cross-Origin Resource Sharing
const helmet = require('helmet'); // Security for HTTP headers
const rateLimit = require('express-rate-limit'); // Rate limiting to prevent abuse
const session = require('express-session'); // Sessions for state management
const MongoStore = require('connect-mongo'); // MongoDB session store

// Load environment variables from .env file
dotenv.config();

// Define the port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// Initialize express application
const app = express();

// Middlewares
app.use(morgan('dev')); // Log every request to the console in development mode
app.use(express.json()); // Parse requests with JSON payloads
app.use(bodyParser.json()); // Parse requests with JSON payloads (redundant with express.json)
app.use(express.urlencoded({ extended: true })); // Parse requests with URL-encoded payloads
app.use(express.static('public')); // Serve static files from 'public' directory

// Date formatting helper function
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US');
};

// Configure template engine with helpers
app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: { formatDate }
}));

app.set('view engine', 'hbs');
app.set('views', './views');

// User activity check with cron
cron.schedule('* * * * *', async () => {
    const fifteenMinutesAgo = new Date(new Date().getTime() - (15 * 60000));
    await User.updateMany({ lastActive: { $lt: fifteenMinutesAgo } }, { isConnected: false });
});

// Security and performance middlewares
app.use(cors()); // Enable all CORS requests
app.use(helmet.contentSecurityPolicy({
    directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://stackpath.bootstrapcdn.com"],
        "img-src": ["'self'", "data:", "https://m.media-amazon.com", "https://images-na.ssl-images-amazon.com"],
    }
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter); // Apply rate limiting middleware

// Configure session management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 3600000 }
}));

// Routes for social media authentication
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback routes for social media authentication
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/auth/google/callback',
    passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));

// Initialize Passport and load authentication strategies
require('./routes/socialauth.js')(app);
app.use(passport.initialize());
app.use(passport.session());

// Middleware to make user session information globally available to all views
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.isAuthenticated = true;
        res.locals.sessionUser = req.session.user;
    } else {
        res.locals.isAuthenticated = false;
    }
    next();
});

// Register book and user routes
app.use('/', booksRoute);
app.use('/', userRoute);

// Connect to database
connectDB();

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
