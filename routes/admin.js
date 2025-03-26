const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController");
const productController = require("../controller/admin/productController");
const categoryController = require("../controller/admin/categoryController");
const brandController = require("../controller/admin/brandController");
const userController=require("../controller/admin/userController")
const orderController=require("../controller/admin/orderController")
const couponController=require("../controller/admin/couponController")
const saleController=require("../controller/admin/saleController")
const adminWalletController=require("../controller/admin/adminWalletController")
const dashboardController=require("../controller/admin/dashboardController")
const adminMiddleware=require("../middlewares/adminAuth")
const adminEnsure=require('../middlewares/adminEnsure')
const upload = require("../config/multer");

// router.use(adminEnsure)

//for login page adminController
router.get("/login",adminController.login);
router.post("/login", adminController.postLogin);




//for products productController
router.get("/products",adminEnsure,adminMiddleware.isLogin,productController.loadProductPage);
router.post(
  "/addproducts",
  upload.array("images", 4),
  productController.addproducts
);
router.get("/addproducts",adminEnsure,adminMiddleware.isLogin, productController.loadAddProducts);
router.get("/fetchbrands",adminEnsure,adminMiddleware.isLogin, productController.fetchBrands);
router.get("/fetchcategories",adminEnsure,adminMiddleware.isLogin, productController.fetchCategories);
router.get("/editproducts/:id",adminEnsure,adminMiddleware.isLogin,productController.loadEditProductPage)
router.patch("/editproducts/:id",upload.array("images",4),productController.updateProduct)
router.patch("/product/status/:id",productController.productStatus)



//for categorys CategoryController

router.get("/category",adminEnsure,adminMiddleware.isLogin, categoryController.loadCategoryPage);
// router.post("/add-category", categoryController.addCategory);
router.post("/add-category",upload.single("image"),categoryController.addCategory);
// router.get("/edit-category", categoryController.loadEditCategory);
router.put("/edit-category/:id",upload.single("image"), categoryController.editCategory);
router.post("/toggle-category-status/:id",categoryController.listUnlistCategory);

//for brands brandController

router.get("/brands",adminEnsure,adminMiddleware.isLogin, brandController.loadBrandPage);
router.post("/add-brands",upload.single("image"),brandController.addBrands)
router.put("/edit-brands/:id",upload.single("image"),brandController.editBrands)
router.patch("/list-unlisted/:id",brandController.listUnlistBrand)


//for users

router.get("/users",adminEnsure,adminMiddleware.isLogin,userController.loadUserPage)
router.patch("/users/status/:id",userController.UserStatus)


//for orders
router.get("/orderList",adminEnsure,adminMiddleware.isLogin,orderController.loadOrderPage)
router.get("/order-details/:id",adminEnsure,adminMiddleware.isLogin,orderController.loadOrderDetailsPage)
router.post("/change-order-Status",orderController.changeOrderStatus)
router.post("/update-item-status",orderController.updateItemStatus)

//for coupons
router.get("/coupon",adminEnsure,adminMiddleware.isLogin,couponController.loadCouponPage)
router.post("/addcoupon",couponController.addCoupon)
router.get("/edit-coupon",adminEnsure,adminMiddleware.isLogin,couponController.loadEditCouponPage)
router.post("/updatecoupon",couponController.updateCoupon)
router.patch("/coupons/toggle-status/:id",couponController.toggleCouponStatus)

//sale report 
router.get("/sale-reports",adminEnsure,adminMiddleware.isLogin, saleController.loadSaleReport);
router.post("/generatePDF",saleController.generatePDF)
router.post("/downloadExcel",saleController.generateExecl)


//for wallet managemenmt
router.get("/wallet-management",adminEnsure,adminMiddleware.isLogin,adminWalletController.loadWalletPage)
router.get("/transaction-details/:id",adminWalletController.loadTransactionPage)

//for dahsboard
router.get("/dashboard",adminEnsure,adminMiddleware.isLogin,dashboardController.loadDashboard)
router.get("/api/orders-data",adminEnsure,adminMiddleware.isLogin,dashboardController.getOrdersDataAPI)
// router.post("/admin/api/ledger-data",dashboardController.getLedgerDataAPI)

//for dasgh
// router.get("/dashboard", dashboardController.loadDashboard); // Renders dashboard page
// router.get("/api/sales-data", dashboardController.getSalesData); // Fetches JSON sales data

//for logout
router.get("/logout",adminController.logoutAdmin)


module.exports = router;
