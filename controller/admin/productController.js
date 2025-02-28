const productSchema=require("../../model/productModel")
// const Product=require("../../model/productModel")
const categorySchema=require("../../model/categoryModel")
const brandSchema=require("../../model/brandModel")
const mongoose = require("mongoose");
const { search } = require("../../routes/admin");



const productController={

loadProductPage:async (req,res) => {
    try {

        let page=parseInt(req.query.page)||1
        let limit=5;
        let skip=(page-1)*limit;
        const searchQuery=req.query.search?req.query.search.trim():"";
        console.log(searchQuery+"thie sseaec")

        let filter={}
        if(searchQuery){
            filter.name={$regex:new RegExp(searchQuery,"i")};
        }

            const totalProducts= await productSchema.countDocuments(filter); // Total count
            const totalPages = Math.ceil(totalProducts/ limit);

            const products = await productSchema.find(filter)
                .populate('categoryId', 'name')
                .populate('brand', 'name logo')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();  

            
            res.render("admin/product", { products , currentPage: page,totalPages,search:searchQuery});
        } catch (error) {
            console.error("Error in fetching product page: " + error);
            res.status(500).send("Internal Server Error");
        }
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
        const existingProduct=await productSchema.findOne( {name: { $regex: new RegExp(`^${name}$`, "i") }} )
        if(existingProduct){
            return res.status(409).json({message:"Product already exists"})
        }
      
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
    const brands = await brandSchema.find({}, "name").lean();
     res.status(200).json(brands);
},fetchCategories:async (req,res) => {
    const categories= await categorySchema.find({},"name").lean();
    res.status(200).json(categories)
},
loadEditProductPage:async (req,res) => {
    try {
        console.log(req.params);
        const id = req.params.id;

        const product = await productSchema.findById(id).populate("categoryId").populate("brand");

        if (!product) {
            return res.status(404).send("Product not found");
        }

        const brands = await brandSchema.find(); // Fetch all brands
        const categories = await categorySchema.find(); // Fetch all categories
        res.render("admin/editproducts", { product, brands, categories });
    } catch (error) {
        res.status(500).send("server error")
        console.log(error)
    }
},
updateProduct:async (req,res) => {
    try {
       const id=req.body.productId
        const {name, brand, categoryId, description, variants }=req.body

        const existingProduct = await productSchema.findById(id);
        const images = req.files && req.files.length > 0 
         ? req.files.map(file => `/uploads/${file.filename}`) 
        : existingProduct.images; // Retain old images if no new ones are uploaded

        
        
        if(!id){
            res.status(400).json({success:false,message:"Product not found.."})
        }
        console.log("hereree");
        const updatedProduct = await productSchema.findByIdAndUpdate(
            id,
            {
                name,
                brand,
                images,
                categoryId,
                description,
                variants: JSON.parse(variants),
            },
            { new: true } // Returns the updated product
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
       
        return res.status(200).json({ success: true, message: "Product updated successfully!", product: updatedProduct });
    } catch (error) {
        res.status(500).send("server error")
    }
},productStatus:async (req,res) => {
    try {
            const id=req.params.id
            console.log(id)
            
            const product=await productSchema.findById(id)
            if(!product){
                return res.status(409).json({message:"No such product found",success:false})
            }
            product.isActive=!product.isActive

            await product.save()
            console.log("worked");
            
            return res.status(200).json({message:"Product updated",success:true})
    } catch (error) {
        res.status(500).send("server error")
        console.log(error)
    }
}
}


module.exports=productController