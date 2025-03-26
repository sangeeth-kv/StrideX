const orderSchema = require("../../model/orderModel");
const productSchema = require("../../model/productModel");
const categorySchema = require("../../model/categoryModel");
const brandSchema = require("../../model/brandModel");

// Helper Function to Get Date Range
const getDateRange = (filter) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (filter) {
        case "daily":
            startDate.setDate(now.getDate() - 7);
            break;
        case "weekly":
            startDate.setDate(now.getDate() - 28);
            break;
        case "monthly":
            startDate.setMonth(now.getMonth() - 12);
            break;
        case "yearly":
            startDate.setFullYear(now.getFullYear() - 5);
            break;
        default:
            startDate.setMonth(now.getMonth() - 12);
    }
    
    return { startDate, endDate: new Date() };
};

const dashboardController = {
    loadDashboard: async (req, res) => {
        try {
            console.log("lloading dashboard");

            const filter = "monthly"; // Default filter
            const { startDate, endDate } = getDateRange(filter);

            const salesData = await orderSchema.aggregate([
                { $match: { status: "delivered", orderDate: { $gte: startDate, $lte: endDate } } },
                { 
                    $group: {
                        _id: { $month: "$orderDate" },
                        totalOrders: { $sum: 1 },
                        revenue: { $sum: "$amountPaid" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            const salesLabels = salesData.map(s => `Month ${s._id}`);
            const salesValues = salesData.map(s => s.totalOrders);


            // Fetch Best-Selling Products (Top 10)
            const bestSellingProducts = await orderSchema.aggregate([
                { $unwind: "$items" },
                { $match: { "items.itemStatus": "delivered" } },
                { $group: { _id: "$items.productId", totalSold: { $sum: "$items.quantity" } } },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                { 
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                { $project: { name: "$productDetails.name", totalSold: 1 } }
            ]);

            // Fetch Best-Selling Categories (Top 10)
            const bestSellingCategories = await orderSchema.aggregate([
                { $unwind: "$items" },
                { $match: { "items.itemStatus": "delivered" } },
                { 
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                { $group: { _id: "$productDetails.categoryId", totalSold: { $sum: "$items.quantity" } } },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                { 
                    $lookup: {
                        from: "categories",
                        localField: "_id",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                },
                { $unwind: "$categoryDetails" },
                { $project: { name: "$categoryDetails.name", totalSold: 1 } }
            ]);

            // Fetch Best-Selling Brands (Top 10)
            const bestSellingBrands = await orderSchema.aggregate([
                { $unwind: "$items" },
                { $match: { "items.itemStatus": "delivered" } },
                { 
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                { $group: { _id: "$productDetails.brand", totalSold: { $sum: "$items.quantity" } } },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                { 
                    $lookup: {
                        from: "brands",
                        localField: "_id",
                        foreignField: "_id",
                        as: "brandDetails"
                    }
                },
                { $unwind: "$brandDetails" },
                { $project: { name: "$brandDetails.name", totalSold: 1 } }
            ]);

            res.render("admin/dashboard", {
                bestSellingProducts,
                bestSellingCategories,
                bestSellingBrands,
                salesData: { salesLabels, salesValues } 
            });

        } catch (error) {
            console.log("Dashboard Error:", error);
            res.status(500).send("Internal Server Error");
        }
    },

    // API to Fetch Sales Data
    getSalesData: async (req, res) => {
        try {
            const filter = req.query.filter || "monthly";
            const { startDate, endDate } = getDateRange(filter);

            const salesData = await orderSchema.aggregate([
                { $match: { status: "delivered", orderDate: { $gte: startDate, $lte: endDate } } },
                { 
                    $group: {
                        _id: filter === "yearly" ? { $year: "$orderDate" } :
                            filter === "monthly" ? { $month: "$orderDate" } :
                            filter === "weekly" ? { $week: "$orderDate" } :
                            { $dayOfWeek: "$orderDate" },
                        totalOrders: { $sum: 1 },
                        revenue: { $sum: "$amountPaid" }
                    }
                },
                { $sort: { "_id": 1 } }  
            ]);

            const salesLabels = salesData.map(s => filter === "yearly" ? `Year ${s._id}` :
                                                   filter === "monthly" ? `Month ${s._id}` :
                                                   filter === "weekly" ? `Week ${s._id}` :
                                                   `Day ${s._id}`);
            const salesValues = salesData.map(s => s.totalOrders);

            res.json({ salesLabels, salesValues,salesData});

        } catch (error) {
            console.log("Error fetching sales data:", error);
            res.status(500).json({ message: "Error fetching sales data" });
        }
    }
};

module.exports = dashboardController;
