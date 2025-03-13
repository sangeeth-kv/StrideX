const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController");
const productController = require("../controller/admin/productController");
const categoryController = require("../controller/admin/categoryController");
const brandController = require("../controller/admin/brandController");
const userController=require("../controller/admin/userController")
const orderController=require("../controller/admin/orderController")
const upload = require("../config/multer");


//for login page adminController
router.get("/login", adminController.login);
router.post("/login", adminController.postLogin);
router.get("/dashboard", adminController.loadDashboard);



//for products productController
router.get("/products", productController.loadProductPage);
router.post(
  "/addproducts",
  upload.array("images", 4),
  productController.addproducts
);
router.get("/addproducts", productController.loadAddProducts);
router.get("/fetchbrands", productController.fetchBrands);
router.get("/fetchcategories", productController.fetchCategories);
router.get("/editproducts/:id",productController.loadEditProductPage)
router.patch("/editproducts/:id",upload.array("images",4),productController.updateProduct)
router.patch("/product/status/:id",productController.productStatus)



//for categorys CategoryController

router.get("/category", categoryController.loadCategoryPage);
// router.post("/add-category", categoryController.addCategory);
router.post("/add-category",upload.single("image"),categoryController.addCategory);
// router.get("/edit-category", categoryController.loadEditCategory);
router.put("/edit-category/:id",upload.single("image"), categoryController.editCategory);
router.post("/toggle-category-status/:id",categoryController.listUnlistCategory);

//for brands brandController

router.get("/brands", brandController.loadBrandPage);
router.post("/add-brands",upload.single("image"),brandController.addBrands)
router.put("/edit-brands/:id",upload.single("image"),brandController.editBrands)
router.patch("/list-unlisted/:id",brandController.listUnlistBrand)


//for users

router.get("/users",userController.loadUserPage)
router.patch("/users/status/:id",userController.UserStatus)


//for orders
router.get("/orderList",orderController.loadOrderPage)
router.get("/order-details/:id",orderController.loadOrderDetailsPage)
router.post("/change-order-Status",orderController.changeOrderStatus)

module.exports = router;
