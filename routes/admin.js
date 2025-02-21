const express=require("express")
const router=express.Router();
const adminController=require("../controller/admin/adminController");
const productController = require("../controller/admin/productController");
const categoryController=require("../controller/admin/categoryController")
const upload = require("../config/multer");



//for login page adminController
router.get("/login",adminController.login)
router.post("/login",adminController.postLogin)
router.get("/dashboard",adminController.loadDashboard)

//for products productController
router.get("/products",productController.loadProductPage)
router.post("/addproducts",upload.array("images",4),productController.addproducts)
router.get("/addproducts",productController.loadAddProducts)
router.get("/fetchbrands",productController.fetchBrands)
router.get("/fetchcategories",productController.fetchCategories)


//for categorys CategoryController

router.get("/category",categoryController.loadCategoryPage)
router.post("/add-category",categoryController.addCategory)
router.get("/edit-category",categoryController.loadEditCategory)
router.put("/edit-category/:id",categoryController.editCategory);
// router.post("/delete-category/:",categoryController.deleteCategory)
router.post("/toggle-category-status/:id",categoryController.listUnlistCategory)



module.exports=router