const orderSchema=require("../../model/orderModel")
const userSchema=require("../../model/userModel")
const cartSchema=require("../../model/cartModel")
const addressSchema=require("../../model/addressModel")
const productSchema=require("../../model/productModel")
const walletSchema=require("../../model/walletModel")
const couponSchema=require("../../model/coupenModel")
const { v4: uuidv4 } = require("uuid"); // Import UUID
// const { default: orders } = require("razorpay/dist/types/orders")


const orderController={
    verifyCOD:async (req,res) => {
        try {
            console.log("here 1");
            console.log("req.body of veriy cod : ",req.body)
            const { totalPrice, createdOn, date, addressId, payment,couponName} = req.body;
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


            for (const item of cart.items) {
                const product = item.productId;
                if (!product) continue;
    
                const variantIndex = product.variants.findIndex(v => v.size === item.size);
                if (variantIndex !== -1) {
                    product.variants[variantIndex].quantity -= item.quantity;
                    await product.save();
                }
            }

            console.log("here 11");
            const orderId = uuidv4();

            const coupon=await couponSchema.findOne({name:couponName})
            if(coupon){
                const couponId=coupon._id

             
                
                coupon.usedBy.push(userId)
                await coupon.save() 
                console.log("this is coupon : ",coupon)
                const newOrder = new orderSchema({
                    orderId: orderId,
                    userId: userId,
                    paymentMethod: "COD",
                    orderDate: date,
                    status: "pending",
                    address: addressId,
                    total: totalPrice,
                    items:items,
                    couponId:couponId
                    
                    
                });
                await newOrder.save();
                await cartSchema.findOneAndUpdate({ userId }, { $set: { items: [] } });

           return res.status(201).json({
                message: "Order placed successfully",
                method: "cod",
                order: newOrder
            });


            }   


            const newOrder = new orderSchema({
                orderId: orderId,
                userId: userId,
                paymentMethod: "COD",
                orderDate: date,
                status: "pending",
                address: addressId,
                total: totalPrice,
                items:items,
                
                
            });
            console.log("here 12");
            await newOrder.save();

            await cartSchema.findOneAndUpdate({ userId }, { $set: { items: [] } });

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
            console.log("order id as a query for load Order details page : ",orderId)
            const order = await orderSchema.findById(orderId)
            .populate("address") 
            .populate("items.productId"); 
            console.log("her eis order",order)
            res.render("user/orderdetails",{orders:order})
        } catch (error) {
            console.log(error)
        }
    },
    returnItemReq:async (req,res) => {
        try {
            console.log("this is my req.body for return : ",req.body)
            const userId=req.session.user?.id
            if(!userId){
                return res.status(404).json({message:"User not authenticated"})
            }
            

            const {orderId,productId}=req.body
            console.log(typeof orderId);
            
            console.log(productId)
            const product=await productSchema.findById(productId)
            const reason=req.body.reason
            console.log(reason)
            const order=await orderSchema.findById(orderId)

            console.log(order)
            if(!order){
                return res.status(404).json({message:"No order Found"})
            }

            const item = order.items.find((item) =>  item.productId.toString() === productId.toString());

            console.log("this is item in req for return  : ",item)

            if (!item) {
                return res.status(404).json({ message: "Product not found in order." });
            }


            item.itemStatus="return request"
            
            item.reason=reason
            // order.returnRequest = {
            //     isRequested: true,
            //     reason: reason, // Store the reason for return
            //     requestedAt: new Date() // Store the request timestamp
            // };

            console.log(order)

            
            await order.save()
            return res.status(200).json({message:"return Send successfullly",success:true})
        } catch (error) {
            console.log(error)
        }
    },updateQuantity:async (req,res) => {
        try {
            console.log("upate quanty here req.body ; ",req.body)

        } catch (error) {
            console.log(error)
        }
    },cancelItem:async (req,res) => {
        try {
            const userId = req.session.user?.id;
            if (!userId) {
                return res.status(404).json({ message: "User not authenticated..!" });
            }
    
            const { orderId, productId } = req.body;
            console.log("Cancel Order: ", orderId, "Product ID: ", productId);

    
            // Find the order
            const order = await orderSchema.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: "No order found..!" });
            }
    
            // Find the product inside the order and update its itemStatus
            const itemIndex = order.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex === -1) {
                return res.status(404).json({ message: "Product not found in order..!" });
            }

            
    
            // Update the itemStatus to "cancelled"
            order.items[itemIndex].itemStatus = "cancelled";
    
            // Increase the product stock back
            const product = order.items[itemIndex];
            await productSchema.updateOne(
                { _id: product.productId, "variants.size": product.size },
                { $inc: { "variants.$.quantity": product.quantity } }
            );
    
            // Check if all items are cancelled, then cancel the order
            const allCancelled = order.items.every(item => item.itemStatus === "cancelled");
            if (allCancelled) {
                order.status = "cancelled";
            }
    
            // Save the updated order
            await order.save();
    
            res.status(200).json({ message: "Product cancelled successfully!", success: true });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },cancelOrder: async (req, res) => {
        try {
          console.log("This is for cancel the order:", req.body);
          const orderId = req.body.orderId;
          const order = await orderSchema.findById(orderId).populate("items.productId");
          const userId = req.session.user?.id;
      
          if (!order) {
            return res.status(404).json({ message: "No order Found..!" });
          }
      
          // If payment method is Razorpay, refund to wallet
          if (order.paymentMethod === "Razorpay") {
            for (let item of order.items) {
              await productSchema.updateOne(
                { _id: item.productId, "variants.size": item.size },
                { $inc: { "variants.$.quantity": item.quantity } } // Restock product quantity
              );
            }
      
            let wallet = await walletSchema.findOne({ userId });
            if (!wallet) {
              wallet = await walletSchema.create({ userId, balance: 0, transactions: [] });
            }
      
            wallet.transactions.push({
              type: "credit",
              amount: order.total,
              reason: `Refund for Order #${orderId}`,
            });
      
            wallet.balance += order.total;
            await wallet.save();
            console.log("Refund processed successfully!");
      
            order.items.forEach((itm) => {
              itm.itemStatus = "returned";
            });
      
            await order.save()
            return res.status(200).json({
              message: "Order Cancelled! Your money will be credited to your wallet.",
              success: true,
            });
          }
      
          // If not Razorpay, restock the products
          for (let item of order.items) {
            await productSchema.updateOne(
              { _id: item.productId, "variants.size": item.size },
              { $inc: { "variants.$.quantity": item.quantity } }
            );
          }
      
          order.status = "cancelled";
          await order.save();
      
          res.status(200).json({ message: "Order Cancelled!", success: true });
      
        } catch (error) {
          console.error("Error in cancelOrder:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      }
      ,returnOrderReq:async (req,res) => {
        try {
            console.log("this is for requset for order : ",req.body)
            const {orderId,reason}=req.body

            const order=await orderSchema.findById(orderId)

            if(!order){
             return res.status(404).json({message:"Order not found..!"})
            }
console.log("here od fjosdf :");
console.log("order oss : ",order)

            order.status="return request"
            console.log(order.status)
            console.log("fnaly : ",order)
            order.returnRequest = {
                isRequested: true,
                reason: reason, // Store the reason for return
                requestedAt: new Date() // Store the request timestamp
            };

            await order.save()
            return res.status(200).json({message:"Order cancelled",success:true})

        } catch (error) {
            console.log(error)
        }
    },
    loadSuccessOrderPage:async (req,res) => {
        const orderId=req.query.id
        const order=await orderSchema.findById(orderId)
        
        res.render("user/ordersuccesspage",{order,orderId})
    }
}

module.exports=orderController