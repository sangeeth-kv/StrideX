const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { verifyCOD } = require("./orderController");
const userSchema=require("../../model/userModel")
const cartSchema=require("../../model/cartModel")
const orderSchema=require("../../model/orderModel")
const productSchema=require("../../model/productModel")
const addressSchema=require("../../model/addressModel")
const { v4: uuidv4 } = require("uuid"); // Import UUID
// Load environment variables
require("dotenv").config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const paymentContoller={
    createOrder:async (req,res) => {
        try {
            console.log("here order..")
            console.log("this is req.boduu : ",req.body)
            const {totalPrice,addressId,payment,couponDiscountValue,couponName}=req.body

            const userId = req.session.user?.id;
            const user = await userSchema.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }


            const cart = await cartSchema.findOne({ userId }).populate("items.productId");
            if (!cart || cart.items.length === 0) {
                return res.status(404).json({ success: false, message: "Cart is empty" });
            }
    
            const address = await addressSchema.findById(addressId);
            if (!address) {
                return res.status(400).json({ success: false, message: "Address not found" });
            }

             // ✅ Check Stock Availability

            let outOfStockItems = [];
            let items = [];
    
            for (const item of cart.items) {
                items.push({
                    productId: item.productId._id,
                    size: item.size,
                    quantity: item.quantity
                });
    
                const product = item.productId;
                if (!product) continue;
    
                const variant = product.variants.find(v => v.size === item.size);
                if (!variant || variant.quantity < item.quantity) {
                    outOfStockItems.push({
                        productId: product._id,
                        productName: product.name,
                        selectedSize: item.size,
                        availableStock: variant ? variant.quantity : 0,
                        requestedQuantity: item.quantity,
                        message: "Insufficient stock"
                    });
                }
            }
    
            // If items are out of stock, return an error
            if (outOfStockItems.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Some items are out of stock",
                    outOfStockItems
                });
            }
    

            const options = {
                amount: totalPrice * 100, // Razorpay accepts amount in paise
                currency:  "INR",
                receipt: `receipt_${Date.now()}`,
              };

              const order = await razorpay.orders.create(options);

              const coupon=await couponSchema.findOne({name:couponName})

                if (coupon) {
                  const couponId = coupon._id;

                  coupon.usedBy.push(userId);
                  await coupon.save();
                  console.log("this is coupon : ", coupon);
                  const newOrder = new orderSchema({
                    orderId: orderId,
                    userId: userId,
                    paymentMethod: "COD",
                    orderDate: date,
                    status: "pending",
                    address: addressId,
                    total: totalPrice,
                    items: items,
                    couponId: couponId,
                  });
                  await newOrder.save();
                  await cartSchema.findOneAndUpdate(
                    { userId },
                    { $set: { items: [] } }
                  );

                  return res.status(201).json({
                    message: "Order placed successfully",
                    method: "cod",
                    order: newOrder,
                  });
                }   
              

             
              const newOrder = new orderSchema({
                  orderId:order.id,//razor pay order id
                  userId,
                  paymentMethod: "Razorpay",
                  orderDate: new Date(),
                  paymentStatus: "pending",
                  address: addressId,
                  total:totalPrice,
                  items
              });
      
              await newOrder.save();
              console.log("completed create orderee>>>")
              res.json({order,newOrder})
              
        } catch (error) {
            console.log(error)
        }
    },
    verifyPayment: async (req, res) => {
        try {

            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId, total } = req.body;
            console.log("verifyPayment request body: ", req.body);
    
            const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const generatedSignature = hmac.digest("hex");
    
            const userId = req.session.user?.id;
            const user = await userSchema.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }


            const cart = await cartSchema.findOne({ userId }).populate("items.productId");
            if (!cart || cart.items.length === 0) {
                return res.status(404).json({ success: false, message: "Cart is empty" });
            }
    
            const address = await addressSchema.findById(addressId);
            if (!address) {
                return res.status(400).json({ success: false, message: "Address not found" });
            }

            const order = await orderSchema.findOne({ orderId: razorpay_order_id });
            console.log("order find using razor pay id :=== ",order)

    
            const orderId = order?._id;
// console.log("order _id:", orderId);

            console.log('order aid : ',orderId)
           
            if (generatedSignature !== razorpay_signature) {
                
                await orderSchema.findByIdAndUpdate(orderId, { paymentStatus: "failed", status: "failed" });

            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
                redirectUrl: `/user/order-failure/${orderId}`
            });
                // return res.status(400).json({ success: false, message: "Invalid payment signature" ,redirectUrl:`/user/order-failure/${orderId}`});
            }
    
           
           
    
            // ✅ Deduct stock
            for (const item of cart.items) {
                const product = item.productId;
                if (!product) continue;
    
                const variantIndex = product.variants.findIndex(v => v.size === item.size);
                if (variantIndex !== -1) {
                    product.variants[variantIndex].quantity -= item.quantity;
                    await product.save();
                }
            }
    
            await cartSchema.findOneAndUpdate({ userId }, { $set: { items: [] } });
           
            
            console.log("order id is here : ",order)
    
            res.json({ success: true, message: "Payment verified successfully", order});
        } catch (error) {
            console.error("Error in verifyPayment:", error);
            res.status(500).json({ success: false, message: "Server error during payment verification" });
        }
    },
    paymentFailed:async (req,res) => {
        try {
            console.log("paymnt failed req.boyd : ",req.body)
            const { orderId, reason, message } = req.body;

            if (!orderId) {
                return res.status(400).json({ success: false, message: "Order ID is required" });
            }
    
            const order = await orderSchema.findOne({ orderId });
            if (!order) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

            order.status = "failed";
            order.paymentStatus = "failed";

            await order.save();
            console.log(order._id)
            res.json({ success: true, message: "Order marked as failed", orderId: order._id });
        } catch (error) {
            console.log(error)
        }
    },
        orderFailure:async (req,res) => {
        try {
            console.log("here url params : ",req.params)
            const orderId=req.params.id
            
            const order=await orderSchema.findById(orderId)
            res.render("user/orderfailure", { orderId: order._id })
        } catch (error) {
            console.log(error)
        }
    } ,
    retryPayment:async (req,res) => {
        try {
            console.log("reached retry payment controller>>>>>")
            const orderId=req.params.id
            console.log(orderId)
            const order = await orderSchema.findById( orderId );
            console.log("this is orde here : ",order)
            console.log("this is address id  : ",order.address)

            if(!order){
                return res.status(404).json({message:"Order not found"})
            }

            // if (order.paymentStatus !== "failed") {
            //     return res.status(400).json({ message: "Only failed orders can be retried" });
            // }
    
            // Create a new payment order on Razorpay
            const options = {
                amount: order.total * 100, // Convert to paise
                currency: "INR",
                receipt: `retry_${order.orderId}`,
            };
    
            const newOrder = await razorpay.orders.create(options);
    
            // Update the existing order with the new Razorpay order ID
            order.orderId = newOrder.id;
            order.paymentStatus = "pending";
            await order.save();
            console.log("here reahes")
            console.log("new order :  ",newOrder    )
    
            res.json({newOrder,addressId:order.address});

        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=paymentContoller
