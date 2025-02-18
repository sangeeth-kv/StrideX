const adminModel=require("../../model/adminModel")
const productSchema=require("../../model/productModel")
const bcrypt=require("bcrypt")




const adminController={
login:async (req,res) => {
res.render("admin/login")
},

// postLogin:async (req,res) => {
//     const {email,password}=req.body
//     console.log(email+" "+password)
//     const admin=await adminModel.findOne({email})
//     console.log(admin)
// }
// postLogin:async (req,res) => {
//     try {
//         const {email,password}=req.body
//     console.log(email+" "+password)
//     const admin=await adminModel.findOne({email})
//     console.log(admin)

//     if(!admin){
//        return res.render("admin/login",{message:"Wrong email address",type:"error"})
//     }
//     const isMatch=await bcrypt.compare(password,admin.password)
//     if(!isMatch){
//         return res.render("admin/login",{message:"Password must match",type:"error"})
//     }
//     res.redirect("/admin/dashboard")

//     } catch (error) {
//         console.log(error)
//     }
// },


postLogin: async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);

        const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email !',
                status: 'error',
            })
        }
        const admin = await adminModel.findOne({ email });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Wrong email address" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
        }

        // Here, you may generate a JWT token if needed and send it back
        return res.status(200).json({ success: true, message: "Login successful" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
},

loadDashboard:async (req,res) => {
    res.render("admin/dashboard")
},
productPage:async (req,res) => {
 
    try {
        // Fetch products from database (assuming you're using Mongoose)
        const product= await productSchema.find(); // Make sure `Product` is defined

        // Render the page and pass the products array
        res.render("admin/product", { product: product }); // Ensure "product" is the correct key
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }

},
loadAddProducts:async (req,res) => {
    res.render("admin/addproducts")
}
}
module.exports=adminController
