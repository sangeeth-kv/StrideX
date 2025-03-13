const orderSchema=require("../../model/orderModel")
const userSchema=require("../../model/userModel")
const cartSchema=require("../../model/cartModel")
const addressSchema=require("../../model/addressModel")
const productSchema=require("../../model/productModel")
const { v4: uuidv4 } = require("uuid"); // Import UUID


const orderController={
    verifyCOD:async (req,res) => {
        try {
            console.log("here 1");
            console.log(req.body)
            const { totalPrice, createdOn, date, addressId, payment } = req.body;
             const userId=req.session.user?.id
             console.log("here 2");

             if(!userId){
                return res.status(400).json({ error: "User need to authenticate" });
             }
             console.log("here 3");
             if (!totalPrice || !addressId || !payment) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            console.log("here 4");

            const address=await addressSchema.findById(addressId)
            console.log("here 5");
            if(!address){
                return res.status(404).json({ error: "Address not found" });
            }
            const cart = await cartSchema.findOne({ userId }).populate("items.productId"); 
            console.log("here 6");
            if (!cart || cart.items.length === 0) {
                    return res.status(404).json({ message: "Cart is empty" });
            }
            console.log("here 7");
            
            // const selectedItems = cart.items.map(item => {
            //     return {
            //         productId: item.productId._id, // Product ID
            //         productName: item.productId.name, // Product Name
            //         selectedSize: item.size, // Selected Size
            //         regularPrice: item.productId.variants.find(v => v.size === item.size)?.regularPrice || 0,
            //         salePrice: item.productId.variants.find(v => v.size === item.size)?.salePrice || 0,
            //         quantity: item.quantity,
            //     };
            // });
            // console.log("seleccted items : ",selectedItems)
            console.log(cart);

            let outOfStockItems = [];
            let items=[]
            console.log("here 8");
           


            for (const item of cart.items) {
                items.push({
                    productId: item.productId._id, 
                    size: item.size, 
                    quantity: item.quantity
                });
            }

            console.log("this is item : ",items)
            for (const item of cart.items) {
                const product = item.productId; // Get product details
                if (!product) continue;
                

                // Find the product variant that matches the selected size
                const variant = product.variants.find(v => v.size === item.size);

                
              
    
                if (!variant) {
                    outOfStockItems.push({
                        productId: product._id,
                        productName: product.name,
                        selectedSize: item.size,
                        message: "Variant not found"
                    });
                    continue;
                }
                console.log("here 9");
    
                // Check if the stock is available
                if (variant.quantity < item.quantity) {
                    outOfStockItems.push({
                        productId: product._id,
                        productName: product.name,
                        selectedSize: item.size,
                        availableStock: variant.quantity,
                        requestedQuantity: item.quantity,
                        message: "Insufficient stock"
                    });
                }
            }
            console.log("here 10");
            // If any items are out of stock, return an error response
            if (outOfStockItems.length > 0) {
                return res.status(400).json({
                    error: "Some items are out of stock",
                    outOfStockItems
                });
            }
            console.log("here 11");
            const orderId = uuidv4();

            const newOrder = new orderSchema({
                orderId: orderId,
                userId: userId,
                paymentMethod: "COD",
                orderDate: date,
                status: "pending",
                address: addressId,
                total: totalPrice,
                items:items
                
            });
            console.log("here 12");
            await newOrder.save();

           return res.status(201).json({
                message: "Order placed successfully",
                method: "cod",
                order: newOrder
            });


        } catch (error) {
            console.log(error)
        }
    },
    loadOrderDetailsPage:async (req,res) => {
        try {
            const orderId=req.query.id
            const order = await orderSchema.findById(orderId)
            .populate("address") 
            .populate("items.productId"); 
            console.log("her eis order",order)
            res.render("user/orderdetails",{orders:order})
        } catch (error) {
            console.log(error)
        }
    },
    returnOrderReq:async (req,res) => {
        try {
            const userId=req.session.user?.id
            const orderId=req.body.orderId
            const order=await orderSchema.findById(orderId)
            
            console.log(order)

        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=orderController