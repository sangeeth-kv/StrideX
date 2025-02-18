const express=require("express")
const router=express.Router();
const adminController=require("../controller/admin/adminController")




router.get("/login",adminController.login)
router.post("/login",adminController.postLogin)
router.get("/dashboard",adminController.loadDashboard)
router.get("/products",adminController.productPage)
router.get("/addproducts",adminController.loadAddProducts)


module.exports=router