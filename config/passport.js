// // const passport = require("passport");
// // const password=require("passport");
// // const GoogleStrategy=require("passport-google-oauth20").Strategy;

// // passport.serializeUser((user,done)=>{
// //     done(null,user);
// // });
// // passport.deserializeUser(function(user,done){
// //     done(null,user)
// // });

// // passport.use(new GoogleStrategy({
// //     clientID:process.env.CLIENT_ID,
// //     clientSecret:process.env.CLIENT_SECRET,
// //     callbackURL:"http://localhost:3000/auth/google/callback",
// //     passReqToCallback:true
// // },function(request,accessToken,refreshToken,profile,done){
// //     return done (null,profile);
// // }));
// const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const User = require("./model/userModel"); // Ensure you have a User model
// require("dotenv").config();

// passport.serializeUser((user, done) => {
//     done(null, user.id); // Store only the user ID in session
// });

// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await User.findById(id);
//         done(null, user);
//     } catch (error) {
//         done(error, null);
//     }
// });

// passport.use(new GoogleStrategy(
//     {
//         clientID: process.env.CLIENT_ID,
//         clientSecret: process.env.CLIENT_SECRET,
//         callbackURL: process.env.PASSPORT_CALLBACK_URL,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//         try {
//             let user = await User.findOne({ googleId: profile.id });

//             if (user) {
//                 // If user already exists, pass a message to the frontend
//                 return done(null, user, { message: "You already have an account. Please log in." });
//             }

//             user = new User({
//                 googleId: profile.id,
//                 fullname: profile.displayName,
//                 email: profile.emails?.[0]?.value || null, // Ensure email exists
//             });

//             await user.save();
//             return done(null, user);

//             // if (!user) {
//             //     user = new User({
//             //         googleId: profile.id,
//             //         fullname: profile.displayName,
//             //         email: profile.emails[0].value,
//             //     });
//             //     await user.save();
                
//             // }

//             // return done(null, user);
//         } catch (error) {
//             return done(error, null);
//         }
//     }
// ));
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/userModel");
require("dotenv").config();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy(
    {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.PASSPORT_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });
            console.log("access token and refresh token : ".accessToken ,"refresh token : ",refreshToken,"profile : ",profile,"done :",done)
            if (user) {

                console.log("user in google : ",user)
                if (user.googleId) {
                    // If user already has a Google ID, they can log in
                    return done(null, user);
                } else {
                    // If user exists but was created with email/password, prevent Google login
                    return done(null, false, { message: "You already have an account. Please log in with email." });
                }
            }

            // Create new user
            user = new User({
                googleId: profile.id,
                fullname: profile.displayName,
                email: profile.emails[0].value,
            });

            await user.save();
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));
