const productSchema=require("../../model/productModel")
// const Product=require("../../model/productModel")
const categorySchema=require("../../model/categoryModel")
const brandSchema=require("../../model/brandModel")
const mongoose = require("mongoose");



const productController={

loadProductPage:async (req,res) => {
    try {
        // Fetch products from database (assuming you're using Mongoose)
        // const products= await productSchema.find().populate("categoryId","name").populate("brand","name"); 
        // const products = await Product.find().populate("categoryId", "name");
// console.log(JSON.stringify(products, null, 2));

        // const products = await productSchema
        // .find()
        // .populate({ path: "categoryId", select: "name" }) // Explicitly defining population
        // .populate({ path: "brand", select: "name" }); 
        // console.log("Fetched Products:", JSON.stringify(products, null, 2))
        

        // Render the page and pass the products array
        // res.render("admin/product", { products }); // Ensure "product" is the correct key
        const products = await productSchema.find()
                .populate('categoryId', 'name')
                .populate('brand', 'name logo')
                .lean();  // Using lean() for better performance

            console.log("Fetched Products:", JSON.stringify(products, null, 2));

            // Render the page with products
            res.render("admin/product", { products });
        } catch (error) {
            console.error("Error in fetching product page: " + error);
            res.status(500).send("Internal Server Error");
        }
        // } catch (error) {
        //     console.error("error in fething in product page"+error);
        //     res.status(500).send("Internal Server Error");
        // }
    },
loadAddProducts:async (req,res) => {
    try {
        const categories=await categorySchema.find()
        
        res.render("admin/addproducts",{categories})
    } catch (error) {
        console.error("error in loading the add product page.."+error);
        res.status(500).send("Internal Server Error");
    }
},
addproducts:async (req,res) => {
    try {
        // const {name,description,categoryId,brand,offer,stock,variants}=req.body
        const { name, description, categoryId, brand, stock, variants } = req.body;
        console.log("ad produc is working "+ name,description)

        if (!name || !description || !categoryId || !brand) {
            return res.status(400).json({ success: false, message: "All required fields must be filled!" });
        }
        console.log(categoryId+"this is category iddddd")
      
        console.log(req.files)
        console.log("erk ekre");
        console.log("Variants received:", req.body.variants);

        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        console.log("image doneeeee")
        const parsedVariants = variants ? JSON.parse(variants) : [];
        console.log("parsed done")

          const newProduct = new productSchema({
            name,
            description,
            categoryId,
            brand,
            // offer: offer || 0,
            images,
            stock: stock || 0,
            variants: parsedVariants
        });
        console.log("wrk here")
        await newProduct.save();

        
        res.json({ success: true, message: "Product added successfully!" });
        // res.redirect("/admin/products")
    } catch (error) {
        console.error("Error in adding products.."+error);
        res.status(500).send("Internal Server Error");
    }
},
deleteProducts:async (req,res) => {
    try {
        
        await productSchema.findByIdAndDelete(req.params.id)
    } catch (error) {
        console.log("error in deleting products"+error)
        res.status(500).send("Error in deleting products")
    }
},fetchBrands:async (req,res) => {
    // const brands= brandSchema.find({},"name")
    const brands = await brandSchema.find({}, "name").lean();
    // const brands = await brandSchema.find({}, "name");

     res.status(200).json(brands);
},fetchCategories:async (req,res) => {
    const categories= await categorySchema.find({},"name").lean();
    res.status(200).json(categories)
},
loadEditProductPage:async (req,res) => {
    try {
        console.log(req.params)
        console.log("wrkingg");
        
        res.render("admin/editproducts")
    } catch (error) {
        res.status(500).send("server error")
        console.log(error)
    }
},
editProducts:async (req,res) => {
    try {
        
    } catch (error) {
        res.status(500).send("server error")
    }
}
}


module.exports=productController