const productSchema=require("../../model/productModel")
const categorySchema=require("../../model/categoryModel")
const brandSchema=require("../../model/brandModel")
const wishlistSchema=require("../../model/wishlistmodel")
const reviewSchema=require("../../model/reviewModel")
const orderSchema=require("../../model/orderModel")


const userProductController={
    getProductDetails:async (req,res) => {
        try {
            const id=req.params.id 
            console.log("this is product id : ",id)
            const product = await productSchema.findById(id)
            .populate('categoryId', 'name description offer')  // Include category offer
            .populate('brand', 'name image description');

            const productOffer = product.offer || 0;
            const categoryOffer = product.categoryId?.offer || 0;
            const maxOffer = Math.max(productOffer, categoryOffer)
            console.log("maax offer find amoung them in product detail page : ",maxOffer)

            
            const reviews = await reviewSchema.find({ productId: id }).populate('userId', 'fullname  _id');
            console.log("reviews : ",reviews)

            let averageRating = 0;

            let userHasPurchased = false;
            if (req.session.user?.id) {
                const userOrders = await orderSchema.find({
                    userId: req.session.user.id,
                    "items.productId": id,
                    status: "delivered"
                });
    
                userHasPurchased = userOrders.length > 0;
            }

             if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = totalRating / reviews.length;
            }

            console.log("this is reviews : ",reviews)

            const relatedProducts = await productSchema.find({
                _id: { $ne: id }, // Not equal to current product
                categoryId: product.categoryId._id // Same category
            })
            .limit(4) // Limit to 4 related products
            .populate('brand', 'name');

            console.log("current user : ",req.session.user)

            let wishlistItems = [];
        if (req.session.user?.id) {
        const wishlist = await wishlistSchema.findOne({ userId: req.session.user?.id }).populate("items.productId"); // changed to optional
        wishlistItems = wishlist ? wishlist.items.map(item => item.productId?._id.toString()) : [];
        }
        console.log("products is here : ", product)

            res.render("user/productview",{product, wishlist:wishlistItems,relatedProducts,maxOffer ,reviews,averageRating,userHasPurchased,currentUser:req.session.user})
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
                .populate('categoryId', 'name offer')
                .populate('brand', 'name logo')
                .sort(sortOptions)
                .lean()
                
    
            // 
            //  Fetch Categories and Brands
            const categories = await categorySchema.find({ isListed: true });
            const brands = await brandSchema.find({}, 'name logo');
    
            //  Get Total Pages for Pagination
            const totalProducts = await productSchema.countDocuments(filter); // Use same `filter` for accurate count
            const totalPages = Math.ceil(totalProducts / limit);

            ///////////////////////////////////////////////////////////////////////////////
            const updatedProducts = product.map((product) => {
                console.log("product offer : ",product.offer)
                console.log("product category offers : ",product.categoryId.offer)
                const productOffer = product.offer || 0; // Ensure product offer is a valid number
                const categoryOffer = product.categoryId?.offer ?? 0; // Ensure category offer is a valid number
                const maxOffer = Math.max(productOffer, categoryOffer); // Get max offer
                return { ...product, maxOffer }; // Add maxOffer field to product object
            });
            console.log("updated products : ",updatedProducts)
            
            ////////////////////////////////////////////////////////////////////////////////

            let wishlistItems = [];
if (req.session.user?.id) {
    const wishlist = await wishlistSchema.findOne({ userId: req.session.user?.id }).populate("items.productId"); // changed to optional
    wishlistItems = wishlist ? wishlist.items.map(item => item.productId?._id.toString()) : [];
}

    console.log("this is wishlists : ",wishlistItems)

console.log("wishslist:  ",wishlistItems)
            res.render("user/shoppage", {
                product:updatedProducts,
                categories,
                brands,
                categoryFilter,
                brandFilter,
                sort: sortFilter,
                searchQuery,
                currentPage: page,
                totalPages,
                wishlist:wishlistItems,
                // highestOffer
            });
    
        } catch (error) {
            console.log("Error in loadShopPage:", error);
        }
    }
 
    
}


module.exports=userProductController