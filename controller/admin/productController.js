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
        console.log("req body of add products : ",req.body)
        const { name, description, categoryId, brand, variants, offer } = req.body;
        console.log(variants)
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
        // const parsedVariants = variants ? JSON.parse(variants) : [];
        const parsedVariants = variants ? JSON.parse(variants).map(variant => ({
            ...variant,
            salePrice: variant.regularPrice - (variant.regularPrice * (offer / 100))
        })) : [];
        console.log("parsed done")

          const newProduct = new productSchema({
            name,
            description,
            offer,
            categoryId,
            brand,
            images,
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
updateProduct: async (req, res) => {
    try {
        console.log("req body of update or edit product : ",req.body)
        const { productId, name, brand, categoryId, description, variants ,offer} = req.body;
        const deletedImages = JSON.parse(req.body.deletedImages || "[]");
        console.log(variants)
        console.log(deletedImages+"thti")

        // Find the existing product
        const existingProduct = await productSchema.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // Remove deleted images from the product
        existingProduct.images = existingProduct.images.filter((image) => !deletedImages.includes(image));

        // Append new uploaded images, if any
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file) => `/uploads/${file.filename}`);
            existingProduct.images.push(...newImages);
        }

        const parsedVariants = JSON.parse(variants).map((variant) => ({
            ...variant,
            salePrice: variant.regularPrice - (variant.regularPrice * (offer / 100)) // Recalculate sale price
        }));

        // Update other product details
        existingProduct.name = name;
        existingProduct.offer=offer;
        existingProduct.brand = brand;
        existingProduct.categoryId = categoryId;
        existingProduct.description = description;
        existingProduct.variants = parsedVariants;

        // Save the updated product
        await existingProduct.save(); // <-- Save after removing images

        return res.status(200).json({ success: true, message: "Product updated successfully!", product: existingProduct });

    } catch (error) {
        console.error("Update Product Error:", error);
        return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
}
,productStatus:async (req,res) => {
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