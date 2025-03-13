const mongoose = require("mongoose");

const productSchema=require("../../model/productModel")
const userSchema=require("../../model/userModel")
const wishlistSchema=require("../../model/wishlistmodel")
const cartSchema=require("../../model/cartModel")


const wishlistController={
    loadWishlistPage: async (req, res) => {
        try {
            const userId = req.session.user?.id;
            console.log("User ID:", userId);
    
            // Validate userId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.log("Invalid user ID format");
                return res.status(400).send("Invalid user ID");
            }
    
            // Find wishlist by userId, not by _id
            const wishlist = await wishlistSchema.findOne({ userId }).populate("items.productId");

            if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
                console.log("Wishlist is empty or not found");
                return res.render("user/wishlistpage", { wishlist: { items: [] } });
            }
    
    
            console.log("Wishlist:", wishlist.items[0].productId);
            const cart=await cartSchema.findOne({userId})

            const cartProductIds = cart ? cart.items.map(item => item.productId.toString()) : [];

            const filteredWishlistItems = wishlist.items.filter(item => 
                !cartProductIds.includes(item.productId?._id.toString()) ///changed to optional 
            );

            console.log("Filtered Wishlist:", filteredWishlistItems);


    
            res.render("user/wishlistpage",  { wishlist: { items: filteredWishlistItems } }); // Pass wishlist data to the frontend
        } catch (error) {
            console.error("Error loading wishlist:", error);
            res.status(500).send("Internal Server Error");
        }
    },
    addToWishlist:async (req,res) => {
        try {
            const productId=req.body.productId
            
            const userId=req.session.user?.id
            console.log("product id : ",productId,"user id : ",userId)
            const user=await userSchema.findById(userId)
            console.log("hei 1");
            
            if(!user){
                return res.status(404).json({message:"User no authenticated"})
            }
            console.log("hei 2");
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid user ID format" });
            }

            console.log("hei 3");
            let wishlist=await wishlistSchema.findOne({userId})
            console.log("hei 4");
            if (!wishlist) {
                wishlist = new wishlistSchema({ userId, items: [{ productId }] });
            } else {
                // Check if product already exists in wishlist
                console.log("hei 5");
                const itemExists = wishlist.items.some(item => item.productId.toString() === productId);
                if (itemExists) {
                    console.log("hei 6");
                    return res.status(400).json({ message: "Product already in wishlist" });
                }
                console.log("hei 7");
                wishlist.items.push({ productId });
            }
            console.log("hei 8");
            await wishlist.save();
            return res.status(201).json({ success:true, message: "Product added to wishlist" });

        } catch (error) {
            console.log(error)
        }
    },
        removeFromWishlist:async (req,res) => {
        try {
            console.log("here 1")
            const productId=req.body.productId
            console.log("p1",productId)
            const userId=req.session.user?.id

            if(!userId){
                return res.status(404).json({message:"User no authenticated"})
            }
            
            // const updatedUser=await userSchema.findByIdAndUpdate(userId,{
            //     $pull:{wishlist:productId}
            // },{new:true});

            const updatedWishlist = await wishlistSchema.findOneAndUpdate(
                { userId }, // Find wishlist by userId
                { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } }, // Remove product
                { new: true }
            );
console.log(updatedWishlist)
            res.json({ success: true, message: 'Product removed from wishlist', wishlist: updatedWishlist });
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=wishlistController