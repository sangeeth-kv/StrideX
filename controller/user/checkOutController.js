const userSchema=require("../../model/userModel")
const orderSchema=require("../../model/orderModel")
const cartSchema=require("../../model/cartModel")
const addressSchema=require("../../model/addressModel")
const couponSchema=require("../../model/coupenModel")


const checkOutController={
    loadCheckoutPage: async (req, res) => {
        try {
            const userId = req.session.user?.id
            if (!userId) {
                return res.render("user/login");
            }
            const coupon = await couponSchema.find({
                $or: [
                    { userId: userId }, // ✅ Coupons assigned to this user
                    { userId: { $size: 0 } } // ✅ General coupons with an empty userId array
                ],
                usedBy: { $nin: [userId] } // ✅ Exclude already used coupons
            }).lean();
            
            

            const user = await userSchema.findById(userId);
            
            // Get cart with populated product data
            const cart = await cartSchema.findOne({ userId })
                .populate({
                    path: "items.productId",
                    populate: [
                        { path: "categoryId", model: "Category" },
                        { path: "brand", model: "Brand" }
                    ]
                });
    
            if (!cart || cart.items.length === 0) {
                return res.render("user/checkoutpage", { 
                    data: [], 
                    grandTotal: 0, 
                    actualTotal: 0, 
                    user, 
                    shippingCharge: 0,
                    finalTotal: 0,
                    Coupon: [] // Add empty coupon array
                });
            }
            
            let actualTotal = 0;
            let grandTotal = 0;
            let additionalDiscount = 0;
    
            const cartData = cart.items.map(item => {
                const product = item.productId;
                const variant = product.variants?.find(v => v.size === item.size);
    
                if (!variant) {
                    console.warn(`No variant found for product ${product.name} with size ${item.size}`);
                    return null;
                }
    
                const regularPrice = variant.regularPrice;
                const offerPercentage = variant.offer || 0;
                const salePrice = regularPrice - (regularPrice * offerPercentage / 100);
                const discount = regularPrice - salePrice;
    
                const subtotal = salePrice * item.quantity;
                grandTotal += subtotal;
                actualTotal += regularPrice * item.quantity;
                
                return {
                    productId: product._id,
                    productName: product.name,
                    productImage: product.images[0],
                    category: product.categoryId ? product.categoryId.name : "Unknown Category",
                    brand: product.brand ? product.brand.name : "Unknown Brand",
                    size: item.size,
                    regularPrice,
                    salePrice,
                    discount,
                    quantity: item.quantity,
                    stock: variant.quantity,
                    subtotal
                };
            }).filter(item => item !== null);
    
            // Calculate additional discount based on order total
            if (grandTotal > 2000) {
                additionalDiscount = grandTotal * 0.10;
            } else if (grandTotal > 1000) {
                additionalDiscount = grandTotal * 0.05;
            }
    
            let shippingCharge = grandTotal >= 1000 ? 0 : 50;
            let finalTotal = grandTotal - additionalDiscount + shippingCharge;
            
            // Fetch user addresses
            const userAddresses = await addressSchema.find({ userId: userId, isDeleted: false });
            
            // Fetch available coupons (you'll need to implement this)
            // const availableCoupons = await couponSchema.find({ isActive: true });
            
            // Mock coupons for now - replace with actual coupon data
           
            console.log("user addresss",userAddresses)
            res.render("user/checkoutpage", { 
                data: cartData.map(item => ({
                    ...item,
                    additionalDiscount // Add the additionalDiscount to each item
                })), 
                Coupon:coupon,
                cart: cart,
                grandTotal, 
                shippingCharge, 
                finalTotal, 
                actualTotal, 
                user,
                userAddresses,
                discount: additionalDiscount // Pass as separate variable
            });
        } catch (error) {
            console.log(error);
            res.status(500).render("error", { message: "Something went wrong" });
        }
    },
    loadOrderAddress:async (req,res) => {
    try {
        res.render("user/useraddress")
    } catch (error) {
        console.log(error)
    }
    },verifyCoupon:async (req,res) => {
        try {
            const userId=req.session.user?.id
            console.log("req body of verify coupon: ", req.body);
        const { couponName, grandTotal } = req.body;
        
        // Find the coupon in the database
        const coupon = await couponSchema.findOne({ 
            name: couponName, 
            isList: true,
            expireOn: { $gt: new Date() } // Check if coupon hasn't expired
        });
        
        // If coupon not found or expired
        if (!coupon) {
            return res.status(200).json({ 
                valid: false, 
                message: "Invalid coupon code or coupon has expired" 
            });
        }
        
        // Check if minimum purchase requirement is met
        if (grandTotal < coupon.minimumPrice) {
            return res.status(200).json({ 
                valid: false, 
                message: `Minimum purchase of ₹${coupon.minimumPrice} required for this coupon` 
            });
        }
        
        // Check if user has already used this coupon (assuming req.user.id is available)
        if (req.session.user.id && coupon.usedBy.includes(req.session.user.id)) {
            return res.status(200).json({ 
                valid: false, 
                message: "You have already used this coupon" 
            });
        }
        
        // Calculate discount (cannot exceed the offer price)
        const discountAmount = Math.min(coupon.offerPrice, grandTotal);
        
        // Return success with discount amount
        return res.status(200).json({
            valid: true,
            discount: discountAmount,
            couponId: coupon._id
        });
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=checkOutController