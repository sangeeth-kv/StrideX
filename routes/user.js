const express=require("express")
const router=express.Router();
const userController=require("../controller/user/userController");
const userProductController=require("../controller/user/userProductController")
const userProfileController=require("../controller/user/userProfileController")
const passport=require("passport");
// const productController = require("../controller/admin/productController");
const userAddressController=require("../controller/user/userAddressController");
const cartController = require("../controller/user/cartController");
const wishlistController=require("../controller/user/wishlistController")
const checkOutController=require("../controller/user/checkOutController")
const orderController=require("../controller/user/orderController")
const InvoiceController=require("../controller/user/invoiceController")
const paymentContoller=require("../controller/user/paymentController")
const referralController=require("../controller/user/referralController")
const reviewController=require("../controller/user/reviewController")
const authMiddlewire=require("../middlewares/authMiddleware")
const userEnsure=require("../middlewares/userEnsure")
// const adminController = require("../controller/admin/adminController");
const upload = require("../config/multer");
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







router.get("/login",userController.loadLogin)
router.post("/signup",userController.signUp)
router.get("/signup",userController.loadSignup)
router.post("/login",userController.signIn)
router.get("/home",authMiddlewire.isBlocked,userController.loadHome)
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



//for user profile
router.get("/view-profile",userEnsure,authMiddlewire.isAuthenticated,authMiddlewire.isBlocked,userProfileController.loadProfilePage)
router.post("/upload-profile-image",upload.single("profileImage"),userProfileController.uploadImage)
router.get("/change-email-otp/:id",authMiddlewire.isAuthenticated,authMiddlewire.isBlocked,userProfileController.loadEmailOtpPage)
router.post("/email-verify-otp",userProfileController.verifyEmailOtp)
router.get("/change-email",userProfileController.loadChangeEmailPage)
router.post("/change-email",userProfileController.changeEmail)
router.post("/email-resend-otp",userProfileController.resendOtpforEmail)
router.post("/verify-current-password",userProfileController.checkCurrentPassword)
router.get("/change-user-password-otp",userProfileController.changeUserpasswordOtpPage)
router.post("/password-verify-otp",userProfileController.verifyOtpChangePassword)
router.get("/change-user-password",userProfileController.changeUserPasswordPage)
router.post("/update-new-password",userProfileController.verifyNewPassword)
//address
router.get("/add-address",userAddressController.loadAddAddressPage)
router.post("/verify-add-address",userAddressController.verifyAddAddress)
router.get("/edit-address/:id",userAddressController.loadEditAddressPage)
router.post("/edit-address/:id",userAddressController.verifyEditAddress)
router.delete("/delete-address/:id",userAddressController.deleteUserAddress)


//add to cart
router.post("/add-to-cart",cartController.addToCart)
router.post("/update-cart-quantity",cartController.updateCartQuantity)
router.get("/cart",authMiddlewire.isAuthenticated,authMiddlewire.isBlocked,cartController.loadCartPage)
router.post("/delete-item/:id",cartController.deleteItem)


//wishlist 
router.get("/wishlist",userEnsure,authMiddlewire.isAuthenticated,authMiddlewire.isBlocked,wishlistController.loadWishlistPage)
router.post("/add-to-wishlist",wishlistController.addToWishlist)
router.post("/remove-from-wishlist",authMiddlewire.isAuthenticated,authMiddlewire.isBlocked,wishlistController.removeFromWishlist)


//checkout page
router.get("/checkout",userEnsure,authMiddlewire.isAuthenticated,authMiddlewire.isBlocked,checkOutController.loadCheckoutPage)
router.get("/add-order-address/:id",userEnsure,checkOutController.loadOrderAddress)
router.post("/validateCoupon",checkOutController.verifyCoupon)

//cod payment
router.post("/cash-on-delivery",orderController.verifyCOD)
router.get("/payment-success-page",userEnsure,orderController.loadSuccessOrderPage)
router.get("/orderDetails",userEnsure,orderController.loadOrderDetailsPage)



//invoice
router.get("/downloadInvoice/:id",userEnsure,InvoiceController.downloadInvoice)


//returnfor items
router.post("/return-request-item",orderController.returnItemReq)
router.post("/update-return-quantity",orderController.updateQuantity)
//return for orders
router.post("/return-request-order",orderController.returnOrderReq)


//cancel for items
router.post("/item-cancel",orderController.cancelItem)
//cancel for orders
router.post("/cancel-order",orderController.cancelOrder)



//for razor payment
router.post("/payment/create-order",paymentContoller.createOrder)
router.post("/payment/verify-payment",paymentContoller.verifyPayment)
router.post("/payment/payment-failed",paymentContoller.paymentFailed)
router.get("/order-failure/:id",userEnsure,paymentContoller.orderFailure)
router.post("/payment/retry-order/:id",paymentContoller.retryPayment)

//for referal
router.post("/apply-referral",referralController.applyReferral)

//for reviews
router.post("/submit-review",reviewController.addReviews)
router.post("/edit-review",reviewController.editReview)
router.delete("/delete-review",reviewController.deleteReview)


module.exports=router;