const userSchema=require("../../model/userModel")
const orderSchema=require("../../model/orderModel")
const cartSchema=require("../../model/cartModel")
const addressSchema=require("../../model/addressModel")


const checkOutController={
    loadCheckoutPage: async (req, res) => {
        try {
            const userId = req.session.user?.id
            if (!userId) {
                return res.render("user/login");
            }
    
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
    }
}

module.exports=checkOutController