const orderSchema=require("../../model/orderModel")
const orderController={
    loadOrderPage:async (req,res) => {
        const orders = await orderSchema.find()
        .populate("userId", "fullname email") // Get user details
        .populate("items.productId", "name price") // Get product details
        .populate("address"); // Get address details

    res.render("admin/orderList", { orders });
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
            if (!orderId || !userId || !status) {
                return res.status(400).json({ message: "Missing required fields." });
            }

            const order=await orderSchema.findOne({orderId,userId})

            if(!order){
                return res.status(404).json({ message: "Order not found." });
            }

            order.status = status;
            await order.save();

            res.status(200).json({ message: "Order status updated successfully." ,status});
        } catch (error) {
            console.log(error)
        }
    }
}


module.exports=orderController