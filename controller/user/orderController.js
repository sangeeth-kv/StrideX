const orderSchema = require("../../model/orderModel");
const userSchema = require("../../model/userModel");
const cartSchema = require("../../model/cartModel");
const addressSchema = require("../../model/addressModel");
const productSchema = require("../../model/productModel");
const walletSchema = require("../../model/walletModel");
const couponSchema = require("../../model/coupenModel");
const { v4: uuidv4 } = require("uuid"); // Import UUID
const { findOne } = require("../../model/adminModel");

// const { default: orders } = require("razorpay/dist/types/orders")

const orderController = {
  verifyCOD: async (req, res) => {
    try {
      console.log("here 1");
      console.log("req.body of veriy cod : ", req.body);
      const { totalPrice, createdOn, date, addressId, payment, couponName } =
        req.body;
      const userId = req.session.user?.id;
      console.log("here 2");

      if (!userId) {
        return res.status(400).json({ error: "User need to authenticate" });
      }

      console.log("here 3");
      if (!totalPrice || !addressId || !payment) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      console.log("here 4");

      const address = await addressSchema.findById(addressId);
      console.log("here 5");
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }

      const cart = await cartSchema.findOne({ userId }).populate({
        path: "items.productId",
        populate: { path: "categoryId", select: "offer name" },
      });

      console.log("here 6");
      if (!cart || cart.items.length === 0) {
        return res.status(404).json({ message: "Cart is empty" });
      }
      console.log("here 7");

      let outOfStockItems = [];
      let items = [];

      console.log("here 8");

      for (const item of cart.items) {
        const product = item.productId;
        if (!product) continue;

        // Find the product variant that matches the selected size
        const variant = product.variants.find((v) => v.size === item.size);

        if (!variant) {
          outOfStockItems.push({
            productId: product._id,
            productName: product.name,
            selectedSize: item.size,
            message: "Variant not found",
          });
          continue;
        }

        console.log("This is variant : ", variant);
        console.log("this is product :", product);

        const itemPrice = variant.regularPrice;
        console.log(
          "Item Price : ",
          itemPrice,
          "Product Offer : ",
          product.offer,
          "Category Offer : ",
          product.categoryId.offer
        );

        const maxOffer = Math.max(product.offer, product.categoryId.offer);
        console.log("Maximum Offer : ", maxOffer);

        const itemSalePrice = itemPrice - itemPrice * (maxOffer / 100);

        // Add sale price to order item
        items.push({
          productId: product._id,
          size: item.size,
          quantity: item.quantity,
          itemSalePrice: itemSalePrice, // Saving calculated sale price
        });

        console.log(
          `Sale Price for ${product.name} (${item.size}): ₹${itemSalePrice}`
        );

        // Check if stock is sufficient
        if (variant.quantity < item.quantity) {
          outOfStockItems.push({
            productId: product._id,
            productName: product.name,
            selectedSize: item.size,
            availableStock: variant.quantity,
            requestedQuantity: item.quantity,
            message: "Insufficient stock",
          });
        }
      }

      console.log("here 10");

      // If any items are out of stock, return an error response
      if (outOfStockItems.length > 0) {
        return res.status(400).json({
          message: "Some items are out of stock",
          outOfStockItems,
        });
      }

      // Deduct stock for each item
      for (const item of cart.items) {
        const product = item.productId;
        if (!product) continue;

        const variantIndex = product.variants.findIndex(
          (v) => v.size === item.size
        );
        if (variantIndex !== -1) {
          product.variants[variantIndex].quantity -= item.quantity;
          await product.save();
        }
      }

      console.log("here 11");
      const orderId = uuidv4();

      const coupon = await couponSchema.findOne({ name: couponName });
      let couponId = null;
      if (coupon) {
        couponId = coupon._id;
        coupon.usedBy.push(userId);
        await coupon.save();
        console.log("this is coupon : ", coupon);
      }

      const newOrder = new orderSchema({
        orderId: orderId,
        userId: userId,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        orderDate: date,
        status: "pending",
        address: addressId,
        total: totalPrice,
        amountPaid: totalPrice,
        items: items, // Now includes sale price
        couponId: couponId,
      });

      await newOrder.save();
      await cartSchema.findOneAndUpdate({ userId }, { $set: { items: [] } });

      return res.status(201).json({
        success:true,
        message: "Order placed successfully",
        method: "cod",
        order: newOrder,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  loadOrderDetailsPage: async (req, res) => {
    try {
      console.log("this is query params : ", req.query);
      const orderId = req.query.id;
      console.log(
        "order id as a query for load Order details page : ",
        orderId
      );
      const order = await orderSchema
        .findById(orderId)
        .populate("address")
        .populate({
          path: "items.productId",
          populate: { path: "categoryId", select: "offer name" },
        });

      order.items = order.items.map((item) => {
        const product = item.productId.toObject(); // Convert Mongoose object to plain object
        console.log("ORDER ITEMS MAP IS HERE  : ", product);

        const categoryOffer = product?.categoryId?.offer || 0; // Ensure category offer is valid
        const productOffer = product?.offer || 0; // Ensure product offer is valid
        const maxOffer = Math.max(productOffer, categoryOffer); // Get highest offer
        console.log(
          "Category Offer:",
          categoryOffer,
          "Product Offer:",
          productOffer,
          "Max Offer:",
          maxOffer
        );

        // Find the variant price based on selected size
        const variant = product.variants.find((v) => v.size === item.size);
        const regularPrice = variant ? variant.regularPrice : 0;
        const salePrice = regularPrice - (regularPrice * maxOffer) / 100;

        // Log values to verify they exist
        console.log(
          `Product: ${product.name}, Regular Price: ${regularPrice}, Sale Price: ${salePrice}, Max Offer: ${maxOffer}`
        );

        return {
          ...item.toObject(), // Convert item to plain object
          maxOffer,
          regularPrice,
          salePrice,
        };
      });

      console.log("this is orders: order>>>>>>>>", order);
      console.log("this is order.items : >>>>>>>>>>", order.items);

      // console.log("her eis order",order)
      res.render("user/orderdetails", { orders: order });
    } catch (error) {
      console.log(error);
    }
  },
  returnItemReq: async (req, res) => {
    try {
      console.log("this is my req.body for return : ", req.body);
      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(404).json({ message: "User not authenticated" });
      }

      const { orderId, productId } = req.body;
      console.log(typeof orderId);

      console.log(productId);
      const product = await productSchema.findById(productId);
      const reason = req.body.reason;
      console.log(reason);
      const order = await orderSchema.findById(orderId);

      console.log(order);
      if (!order) {
        return res.status(404).json({ message: "No order Found" });
      }

      const item = order.items.find(
        (item) => item.productId.toString() === productId.toString()
      );

      console.log("this is item in req for return  : ", item);

      if (!item) {
        return res.status(404).json({ message: "Product not found in order." });
      }

      item.itemStatus = "return request";

      item.reason = reason;
      // order.returnRequest = {
      //     isRequested: true,
      //     reason: reason, // Store the reason for return
      //     requestedAt: new Date() // Store the request timestamp
      // };

      console.log(order);

      await order.save();
      return res
        .status(200)
        .json({ message: "return Send successfullly", success: true });
    } catch (error) {
      console.log(error);
    }
  },
  updateQuantity: async (req, res) => {
    try {
      console.log("upate quanty here req.body ; ", req.body);
    } catch (error) {
      console.log(error);
    }
  },
  cancelItem: async (req, res) => {
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
      const itemIndex = order.items.findIndex(
        (item) => item.productId.toString() === productId
      );
      if (itemIndex === -1) {
        return res
          .status(404)
          .json({ message: "Product not found in order..!" });
      }

      //if razor payyy
      order.items[itemIndex].itemStatus = "cancelled";
      const product = order.items[itemIndex];

      await productSchema.updateOne(
        { _id: product.productId, "variants.size": product.size },
        { $inc: { "variants.$.quantity": product.quantity } }
      );

      const retProduct = await productSchema
        .findOne({ _id: product.productId, "variants.size": product.size })
        .populate("categoryId");
      const getpro = retProduct.variants.filter((vari) => {
        // const regularVariPrice=vari.regularPrice
        if (vari.size == product.size) {
          return vari.regularPrice;
        }
      });
      const maxOffer = Math.max(retProduct.categoryId.offer, retProduct.offer);
      console.log("this is max offerv : ", maxOffer);
      const regularAmount = getpro[0].regularPrice;
      console.log("This is regulat amountt : ", regularAmount);
      const saleAmount = regularAmount - regularAmount * (maxOffer / 100);
      console.log("this is sale amouont : ", saleAmount);

      console.log("this is get produt  : ", getpro);
      console.log("this is return amound", retProduct);
      console.log("this is product", product);

      const allCancelled = order.items.every(
        (item) =>
          item.itemStatus === "cancelled" || item.itemStatus === "returned"
      );
      if (allCancelled) {
        order.status = "cancelled";
      }

      order.total = order.total - saleAmount;
      await order.save();
      /////////////////////////pyemnt less than 0
      if (order.paymentMethod == "Razorpay") {
        let wallet = await walletSchema.findOne({ userId });
        if (!wallet) {
          wallet = await walletSchema.create({
            userId,
            balance: 0,
            transactions: [],
          });
        }

        wallet.transactions.push({
          type: "credit",
          transactionId: uuidv4(),
          amount: saleAmount,
          reason: `Refund for OrderId #${order.orderId} ,${retProduct.name}`,
          orderId: order._id,
        });

        wallet.balance += saleAmount;
        await wallet.save();
        console.log(
          "Refund processed successfully in cancel individual item  >>!"
        );
      }

      res
        .status(200)
        .json({ message: "Product cancelled successfully!", success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  cancelOrder: async (req, res) => {
    try {
      console.log("This is for cancel the order:", req.body);
      const orderId = req.body.orderId;
      const order = await orderSchema
        .findById(orderId)
        .populate("items.productId");
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
          wallet = await walletSchema.create({
            userId,
            balance: 0,
            transactions: [],
          });
        }

        wallet.transactions.push({
          type: "credit",
          transactionId: uuidv4(),
          amount: order.total,
          reason: `Refund for Order #${order.orderId} `,
          orderId: order._id,
        });

        wallet.balance += order.total;
        await wallet.save();
        console.log("Refund processed successfully!");

        order.items.forEach((itm) => {
          itm.itemStatus = "cancelled";
        });


        order.status="cancelled"

        await order.save();
        return res.status(200).json({
          message:
            "Order Cancelled! Your money will be credited to your wallet.",
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

      order.items.forEach((itm) => {
        itm.itemStatus = "cancelled";
      });

      order.status = "cancelled";
      await order.save();

      res.status(200).json({ message: "Order Cancelled!", success: true });
    } catch (error) {
      console.error("Error in cancelOrder:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
 



// cancelOrder: async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
  
//     try {
//       console.log("This is for canceling the order:", req.body);
  
//       const { orderId } = req.body;
//       const userId = req.session.user?.id;
  
//       const order = await orderSchema.findById(orderId).populate("items.productId").session(session);
//       if (!order) {
//         await session.abortTransaction();
//         return res.status(404).json({ message: "No order Found..!" });
//       }
  
//       // Prepare bulk update for product inventory restocking
//       const bulkUpdates = order.items.map(item => ({
//         updateOne: {
//           filter: { _id: item.productId, "variants.size": item.size },
//           update: { $inc: { "variants.$.quantity": item.quantity } }
//         }
//       }));
  
//       await productSchema.bulkWrite(bulkUpdates, { session });
  
//       // If payment was Razorpay, process refund to wallet
//       if (order.paymentMethod === "Razorpay") {
//         let wallet = await walletSchema.findOne({ userId }).session(session);
//         if (!wallet) {
//           wallet = new walletSchema({ userId, balance: 0, transactions: [] });
//         }
  
//         wallet.transactions.push({
//           type: "credit",
//           transactionId: uuidv4(),
//           amount: order.total,
//           reason: `Refund for Order #${order.orderId}`,
//           orderId: order._id
//         });
  
//         wallet.balance += order.total;
  
//         // Use Promise.all to save order and wallet updates concurrently
//         await Promise.all([wallet.save({ session }), orderSchema.updateOne({ _id: orderId }, { status: "cancelled", "items.$[].itemStatus": "cancelled" }, { session })]);
  
//         await session.commitTransaction();
//         session.endSession();
  
//         return res.status(200).json({
//           message: "Order Cancelled! Your money will be credited to your wallet.",
//           success: true
//         });
//       }
  
//       // If payment method is not Razorpay, just mark order as cancelled
//       await orderSchema.updateOne({ _id: orderId }, { status: "cancelled" }, { session });
  
//       await session.commitTransaction();
//       session.endSession();
  
//       res.status(200).json({ message: "Order Cancelled!", success: true });
  
//     } catch (error) {
//       await session.abortTransaction();
//       session.endSession();
//       console.error("Error in cancelOrder:", error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   },
returnOrderReq: async (req, res) => {
    try {
      console.log("this is for requset for order : ", req.body);
      const { orderId, reason } = req.body;

      const order = await orderSchema.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found..!" });
      }
      console.log("here od fjosdf :");
      console.log("order oss : ", order);

      order.status = "return request";
      console.log(order.status);
      console.log("fnaly : ", order);
      order.returnRequest = {
        isRequested: true,
        reason: reason, // Store the reason for return
        requestedAt: new Date(), // Store the request timestamp
      };

      await order.save();
      return res
        .status(200)
        .json({ message: "Order cancelled", success: true });
    } catch (error) {
      console.log(error);
    }
  },
  loadSuccessOrderPage: async (req, res) => {
    const orderId = req.query.id;
    const order = await orderSchema.findById(orderId);
    console.log("order id : ", orderId);
    console.log("order : ", order);

    res.render("user/ordersuccesspage", { order, orderId });
  },
};

module.exports = orderController;
