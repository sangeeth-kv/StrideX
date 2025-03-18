const productSchema=require("../../model/productModel")
const categorySchema=require("../../model/categoryModel")
const brandSchema=require("../../model/brandModel")
const wishlistSchema=require("../../model/wishlistmodel")


const userProductController={
    getProductDetails:async (req,res) => {
        try {
            const id=req.params.id 
            console.log(id)
            const product=await productSchema.findById(id)
            .populate('categoryId', 'name description')
            .populate('brand', 'name image description');

            const relatedProducts = await productSchema.find({
                _id: { $ne: id }, // Not equal to current product
                categoryId: product.categoryId._id // Same category
            })
            .limit(4) // Limit to 4 related products
            .populate('brand', 'name');


            let wishlistItems = [];
        if (req.session.user?.id) {
        const wishlist = await wishlistSchema.findOne({ userId: req.session.user?.id }).populate("items.productId"); // changed to optional
        wishlistItems = wishlist ? wishlist.items.map(item => item.productId?._id.toString()) : [];
        }

            res.render("user/productview",{product, wishlist:wishlistItems,relatedProducts})
        } catch (error) {
            console.log(error)
        }
    },
    loadShopPage: async (req, res) => {
        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 9;
            let skip = (page - 1) * limit;
    
            let searchQuery = req.query.query ? req.query.query.trim() : "";
            let categoryFilter = req.query.category || null;
            let brandFilter = req.query.brand || null;
            let sortFilter = req.query.sort || null;
    
            console.log("category::::" + categoryFilter, "brand::::" + brandFilter, "sort::::" + sortFilter);
    
            let filter = { isActive: true };
    
            // 🔍 Apply Search Filter
            if (searchQuery) {
                filter.name = { $regex: new RegExp(searchQuery, "i") }; // Case-insensitive search
            }
    
            // 🎯 Apply Category Filter
            if (categoryFilter) {
                const categoryData = await categorySchema.findOne({ name: categoryFilter });
                if (categoryData) {
                    filter.categoryId = categoryData._id; 
                }
            }
    
            // 🏷️ Apply Brand Filter
            if (brandFilter) {
                const brandData = await brandSchema.findOne({ name: brandFilter });
                if (brandData) {
                    filter.brand = brandData._id;
                }
            }
    
            // 🔄 Apply Sorting
            let sortOptions = {};
            if (sortFilter === "low-high") {
                sortOptions["variants.0.regularPrice"] = 1;
            } else if (sortFilter === "high-low") {
                sortOptions["variants.0.regularPrice"] = -1;
            } else if (sortFilter === "a-z") {
                sortOptions["name"] = 1;
            } else if (sortFilter === "z-a") {
                sortOptions["name"] = -1;
            }else if (sortFilter === "a-z") {
                sortOptions["name"] = 1;
            } else if (sortFilter === "z-a") {
                sortOptions["name"] = -1}
          
    
            // ✅ Fetch Filtered Products
            const product = await productSchema.find(filter)
                .skip(skip)
                .limit(limit)
                .populate('categoryId', 'name')
                .populate('brand', 'name logo')
                .sort(sortOptions);
    
            // 🌍 Fetch Categories and Brands
            const categories = await categorySchema.find({ isListed: true });
            const brands = await brandSchema.find({}, 'name logo');
    
            // 📊 Get Total Pages for Pagination
            const totalProducts = await productSchema.countDocuments(filter); // Use same `filter` for accurate count
            const totalPages = Math.ceil(totalProducts / limit);

            let wishlistItems = [];
if (req.session.user?.id) {
    const wishlist = await wishlistSchema.findOne({ userId: req.session.user?.id }).populate("items.productId"); // changed to optional
    wishlistItems = wishlist ? wishlist.items.map(item => item.productId?._id.toString()) : [];
}
console.log("wishslist:  ",wishlistItems)
            res.render("user/shoppage", {
                product,
                categories,
                brands,
                categoryFilter,
                brandFilter,
                sort: sortFilter,
                searchQuery,
                currentPage: page,
                totalPages,
                wishlist:wishlistItems
            });
    
        } catch (error) {
            console.log("Error in loadShopPage:", error);
        }
    }
 
    
}


module.exports=userProductController