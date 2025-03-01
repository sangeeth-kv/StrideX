const express=require("express")
const router=express.Router();
const userController=require("../controller/user/userController");
const userProductController=require("../controller/user/userProductController")
const passport=require("passport");
const productController = require("../controller/admin/productController");
// const adminController = require("../controller/admin/adminController");
require("../config/passport")

router.use(passport.initialize())
router.use(passport.session())

// // auth
// router.get("/user/auth/google",passport.authenticate("google",{scope:["email","profile"]}))


//auth callback
// router.get("/user/auth/google/callback",passport.authenticate("google",{
//     successRedirect: "/user/home",
//     failureRedirect: "/user/login"
// }));
// Route for Google authentication
router.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));

// Callback route after Google authentication

router.get( "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/user/login" }),
    (req, res) => {
        if (req.user) {
            req.session.user = {
                id: req.user._id,
                name: req.user.fullname,  // Store user's name
                email: req.user.email,    // Store email
                googleId: req.user.googleId
            };
        }
        console.log("hei googglke")
        res.redirect("/user/home"); // Redirect to home after successful login
    }
);

// router.get(
//     "/auth/google/callback",
//     passport.authenticate("google", { 
//         failureRedirect: "/user/login", 
//         failureFlash: true  // Store failure messages in req.flash("error")
//     }),
//     (req, res) => {
//         if (!req.user) {
//             req.flash("error", "Authentication failed. Please try again.");
//             console.log("🚨 Flash Error Set: Authentication failed");
//             return res.redirect("/user/login");
//         }

//         if (req.authInfo && req.authInfo.message) {
//             req.flash("error", "You have already signed up with this email.");
//             console.log("🚨 Flash Error Set: You have already signed up with this email.");
//             return res.redirect("/user/login");
//         }

//         req.flash("success", "Login successful!");
//         console.log("✅ Flash Success Set: Login successful!");
//         res.redirect("/user/home");
//     }
// );






router.get("/login",userController.loadLogin)
router.post("/signup",userController.signUp)
router.get("/signup",userController.loadSignup)
router.post("/login",userController.signIn)
router.get("/home",userController.loadHome)
// router.get("/verify-otp",userController.loadOTPPage)
router.post("/verify-otp", userController.verifyOTP);
router.post("/resend-otp", userController.resendOTP);
router.post("/forgot-password",userController.forgotPassword)
router.get("/verify-otp",userController.loadVerify)
router.get("/change-password",userController.loadChangePassword)
router.post("/change-password",userController.changePassword)
router.get("/logout",userController.logout)


//for products 
router.get("/view-product/:id",userProductController.getProductDetails)
router.get("/shop",userProductController.loadShopPage)







module.exports=router;