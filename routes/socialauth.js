const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models/User'); // Adjust the path as necessary

module.exports = function(app) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(async function(id, done) {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Facebook Strategy
    passport.use(new FacebookStrategy({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: "http://localhost:5000/auth/facebook/callback",
            profileFields: ['id', 'emails', 'name'] // Requesting access to these fields
        },
        async function(accessToken, refreshToken, profile, done) {
            try {
                let user = await User.findOne({ facebookId: profile.id });
                if (!user) {
                    user = new User({
                        facebookId: profile.id,
                        email: profile.emails[0].value,
                        // Additional user information here
                    });
                    await user.save();
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    ));

    // Twitter Strategy
    passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: "http://localhost:5000/auth/twitter/callback",
        includeEmail: true // Ensure you request email permission in Twitter app settings
        },
        async function(token, tokenSecret, profile, done) {
            try {
                let user = await User.findOne({ twitterId: profile.id });
                if (!user) {
                    user = new User({
                        twitterId: profile.id,
                        email: profile.emails[0].value, // Twitter does not provide emails by default
                        // Additional user information here
                    });
                    await user.save();
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    ));

    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/google/callback"
        },
        async function(accessToken, refreshToken, profile, done) {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        userType: 'google', // Set userType to 'google'
                    });
                    await user.save();
                }
                done(null, user);
            } catch (error) {
                done(error);
            }
        }
    ));
};
