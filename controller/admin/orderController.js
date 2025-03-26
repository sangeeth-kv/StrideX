const orderSchema=require("../../model/orderModel")
const productSchema=require("../../model/productModel")
const walletSchema=require("../../model/walletModel")
const { v4: uuidv4 } = require("uuid"); // Import UUID

const orderController={
    loadOrderPage:async (req,res) => {

        try {
            let page = parseInt(req.query.page) || 1;
            let limit = 5;
            let skip = (page - 1) * limit;
            const searchQuery = req.query.search ? req.query.search.trim() : "";
    
            let matchStage = {};
    
            if (searchQuery) {
                matchStage.$or = [
                    { orderId: { $regex: new RegExp(searchQuery, "i") } }, // Search by Order ID
                    { "user.fullname": { $regex: new RegExp(searchQuery, "i") } }, // Search by User Name
                    { "items.product.name": { $regex: new RegExp(searchQuery, "i") } } // Search by Product Name
                ];
            }
    
            const aggregationPipeline = [
                { $sort: { orderDate: -1 } },
                { $skip: skip },
                { $limit: limit },
    
                // Lookup User Details
                {
                    $lookup: {
                        from: "users", // Collection name in DB
                        localField: "userId",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$user" }, // Convert array to object for filtering
    
                // Lookup Product Details
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "items.product"
                    }
                },
    
                { $match: matchStage }, // Apply search filter
    
                // Lookup Address Details
                {
                    $lookup: {
                        from: "addresses",
                        localField: "address",
                        foreignField: "_id",
                        as: "address"
                    }
                }
            ];
    
            const orders = await orderSchema.aggregate(aggregationPipeline);
            const totalOrders = await orderSchema.countDocuments(matchStage);
            const totalPages = Math.ceil(totalOrders / limit);
            console.log("order : ",orders)
    
            res.render("admin/orderlist", {
                orders,
                currentPage: page,
                totalPages,
                search: searchQuery,
            });
        } catch (error) {
            console.log(error)
            res.status(500).send("Server error");
        }

    },
    loadOrderDetailsPage:async (req,res) => {
        try {
            const orderId=req.params.id
            const order = await orderSchema.findById(orderId)
            .populate("address")
            .populate("items.productId");

        console.log("Fetched Order:", order); // Debugging log

        if (!order) {
            return res.render("admin/ordermanagement", { orders: [] });
        }

        res.render("admin/ordermanagement", { orders: order }); 
        } catch (error) {
            console.log(error)
        }
    },changeOrderStatus:async (req,res) => {
        try {
           
            const { orderId, userId, status } = req.body;
            console.log(orderId)
            if (!orderId || !userId || !status) {
                return res.status(400).json({ message: "Missing required fields." });
            }

            const order=await orderSchema.findOne({orderId,userId})

            if(!order){
                return res.status(404).json({ message: "Order not found." });
            }
            console.log("this is statysss:" ,status)
            if( status==="returned"){
                for (const item of order.items) {
                    await productSchema.updateOne(
                        { _id: item.productId, "variants.size": item.size },
                        { $inc: { "variants.$.quantity": item.quantity } }
                    );
                }

                let wallet=await walletSchema.findOne({userId})

                if (!wallet) {
                    // If wallet doesn't exist, create one
                    wallet = await walletSchema.create({ userId, balance: 0, transactions: [] });
                }
                console.log(orderId)

                if(order.total>0){
                wallet.transactions.push({
                    type: "credit",
                    transactionId:uuidv4(),
                    amount: order.total,
                    reason: `Refund for Order #${orderId}`,
                    orderId:order._id
                });
                 
                wallet.balance += order.total
                await wallet.save();
              }
                console.log("Refund processed successfully!");

                order.items.forEach((itm)=>{
                    itm.itemStatus="returned"
                })

            }

            
            order.status = status;
            await order.save();

            res.status(200).json({ message: "Order status updated successfully." ,status});
        } catch (error) {
            console.log(error)
        }
    },updateItemStatus:async (req,res) => {
        try {

            console.log("req.body of update item status:", req.body);
        const { orderId, itemProductId, status } = req.body;
        console.log("this is item product id : ",itemProductId)
            console.log(orderId)
        // Find the order by orderId
        const order = await orderSchema.findOne({ orderId });
        console.log("this is order",order)
        console.log("here 1");

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }
        console.log("here 2");
        // Find the specific item inside the order's items array
        console.log("this is ordereed items : ",order.items)
        const item = order.items.find((item) =>  item.productId.toString() === itemProductId.toString());
        console.log("this is items by admin :  ",item)

        if (!item) {
            return res.status(404).json({ message: "Product not found in order." });
        }
        console.log("here 3");
        // Update the item's status
        console.log("this is item.itm ,status ",item.itemStatus)

        item.itemStatus = status;

        //for return,when quanty increase and price back to walet
        if(item.itemStatus=="returned"){

            const product = await productSchema.findById(item.productId);

            if (!product) {
                return res.status(404).json({ message: "Product details not found." });
            }

            const variant = product.variants.find((variant) => variant.size === item.size);
            if (!variant) {
                return res.status(404).json({ message: "Variant size not found." });
            }

            variant.quantity += item.quantity; 
            await product.save();

            const regularPrice = variant.regularPrice;
            const offerPercentage = variant.offer || 0;
            const salePrice = regularPrice - (regularPrice * offerPercentage / 100);

            const userId=order.userId

            let wallet=await walletSchema.findOne({userId})

            if (!wallet) {
                // If wallet doesn't exist, create one
                wallet = await walletSchema.create({ userId, balance: 0, transactions: [] });
            }

            if(item.itemSalePrice*item.quantity>0){
            
                wallet.transactions.push({
                    type: "credit",
                    transactionId:uuidv4(),
                    amount: item.itemSalePrice*item.quantity,
                    reason: `Refund for Order #${orderId} of item ${product.name}`,
                    orderId:order._id
                });
                 
                wallet.balance += item.itemSalePrice * item.quantity;
                await wallet.save();

                order.total-=item.itemSalePrice*item.quantity
                await order.save()
            }

                 // Check if all items are cancelled or returned
        const allItemsCancelledOrReturned = order.items.every(item =>
            item.itemStatus === "cancelled" || item.itemStatus === "returned"
        );

        if (allItemsCancelledOrReturned) {
            order.status = "cancelled"; // Cancel the entire order
        }
       


                order.total -= item.itemSalePrice * item.quantity;

                await order.save()

        }

        console.log("here 4");
        // Save the updated order
        await order.save();

        return res.status(200).json({ success: true, message: "Item status updated successfully." });
        } catch (error) {
            console.log(error)
        }
    }
}


module.exports=orderController