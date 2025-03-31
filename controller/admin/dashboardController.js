
const orderSchema = require("../../model/orderModel");
const productSchema = require("../../model/productModel");
const cateegorySchema = require("../../model/categoryModel");
const brandSchema = require("../../model/brandModel");
const walletSchema = require("../../model/walletModel");
const userSchema=require("../../model/userModel")

// Helper function to determine date range
const getDateRange = (period) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'daily': startDate.setDate(now.getDate() - 7); break;
        case 'weekly': startDate.setDate(now.getDate() - 28); break;
        case 'monthly': startDate.setMonth(now.getMonth() - 12); break;
        case 'yearly': startDate.setFullYear(now.getFullYear() - 5); break;
        default: startDate.setMonth(now.getMonth() - 12);
    }
    console.log("date find succesfully>>>>>>>>");
    
    return { startDate, endDate: new Date() };
};

const calculateConversionRate=async()=>{
    const userCount=await userSchema.countDocuments()
    const orderCount=await orderSchema.countDocuments({status:"delivered"})
    if(userCount==0){
        return 0
    }

    conversionRate=(orderCount/userCount)*100
    return conversionRate.toFixed(2)
}

function getGroupingField(timeFilter) {
    switch(timeFilter) {
        case 'daily': 
            return { 
                day: { $dayOfMonth: "$orderDate" }, 
                month: { $month: "$orderDate" } 
            };
        case 'weekly': 
            return { $week: "$orderDate" };
        case 'monthly': 
            return { $month: "$orderDate" };
        case 'yearly': 
            return { $year: "$orderDate" };
        default: 
            return { $month: "$orderDate" };
    }
}

const dashboardController = {
    loadDashboard: async (req, res) => {
        try {
            console.log("Loading Admin Dashboard...");
            const timeFilter = req.query.timeFilter || 'monthly';
            console.log("timeFilter :",timeFilter)
            const { startDate, endDate } = await getDateRange(timeFilter);
            console.log("start date : ",startDate," end date : ",endDate)

            // Get total orders, revenue, and average order value
            const ordersStats = await orderSchema.aggregate([
                { $match: { orderDate: { $gte: startDate, $lte: endDate }, status: { $nin: ["cancelled", "returned"] } } },
                { $group: { _id: null, totalorderSchemas: { $sum: 1 }, revenue: { $sum: "$amountPaid" } } }
            ]);

            console.log("Order stats : ",ordersStats)

            const totalorderSchemas = ordersStats[0]?.totalorderSchemas || 0;
            const revenue = ordersStats[0]?.revenue || 0;
            const avgorderSchemaValue = totalorderSchemas > 0 ? (revenue / totalorderSchemas).toFixed(2) : 0;
            console.log("total order schemas : ",totalorderSchemas)

            // Fetch top 10 best-selling products
            const topproductSchemas = await orderSchema.aggregate([
               
                { $unwind: "$items" },
                {$match:{"items.itemStatus":{$nin:["cancelled", "returned"]}}},
                { 
                    $group: {
                        _id: "$items.productId",
                        count: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { count: -1 } },
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
                { 
                    $project: {
                        name: "$productDetails.name",
                        count: 1
                    }
                }
            ]);

            // Fetch top 10 best-selling categories
            const topCategories = await orderSchema.aggregate([
              
                { $unwind: "$items" },
                {$match:{"items.itemStatus":{$nin:["cancelled", "returned"]}}},
                { 
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                { 
                    $group: {
                        _id: "$productDetails.categoryId",
                        count: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { count: -1 } },
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
                { 
                    $project: {
                        name: "$categoryDetails.name",
                        count: 1
                    }
                }
            ]);

            // Fetch top 10 best-selling brands
            const topbrandSchemas = await orderSchema.aggregate([
                
                { $unwind: "$items" },
                {$match:{"items.itemStatus":{$nin:["cancelled", "returned"]}}},
                { 
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                { 
                    $group: {
                        _id: "$productDetails.brand",
                        count: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { count: -1 } },
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
                { 
                    $project: {
                        name: "$brandDetails.name",
                        count: 1
                    }
                }
            ]);

            // Prepare sales chart data
            const salesData = await orderSchema.aggregate([
                { 
                    $group: {
                        _id: { $month: "$orderDate" },
                        count: { $sum: 1 },
                        revenue: { $sum: "$amountPaid" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);
            console.log("sales data : ",salesData);
            

            const salesLabels = salesData.map(s =>` Month ${s._id}`);
            const salesValues = salesData.map(s => s.count);

            const conversionRate= await calculateConversionRate()
            
            console.log("conversion rate : ",conversionRate)
            
            console.log("sales laels : ",salesLabels);
            console.log("sales vlaues : ",salesValues)

            console.log("complted load dashboard >>>>>>>")
            console.log("top prodyc schma : ",topproductSchemas)

            res.render("admin/dashboard", {
                totalorderSchemas,
                revenue,
                avgorderSchemaValue,
                topproductSchemas,
                topCategories,
                topbrandSchemas,
                conversionRate,
                ordersData: { labels: salesLabels, values: salesValues }
            });

        } catch (error) {
            console.log("Dashboard Error:", error);
            res.status(500).send("Internal Server Error");
        }
    },
    getOrdersDataAPI: async (req, res) => {
        try {
            const timeFilter = req.query.timeFilter || 'monthly';
            const { startDate, endDate } = getDateRange(timeFilter);

            const salesData = await orderSchema.aggregate([
                { 
                    $match: { 
                        orderDate: { $gte: startDate, $lte: endDate },
                        status: { $nin: ["cancelled", "returned"] } 
                    } 
                },
                { 
                    $group: {
                        _id: getGroupingField(timeFilter),
                        count: { $sum: 1 },
                        revenue: { $sum: "$amountPaid" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            // Create labels and values based on the time filter
            const labels = salesData.map(s => {
                switch(timeFilter) {
                    case 'daily': return `${s._id.day}/${s._id.month}`;
                    case 'weekly': return `Week ${s._id}`;
                    case 'monthly': return `Month ${s._id}`;
                    case 'yearly': return `${s._id}`;
                    default: return `${s._id}`;
                }
            });
            const values = salesData.map(s => s.count);
            console.log("lables : ",labels)
            console.log("values : ",values)

            res.json({ labels, values });
        } catch (error) {
            console.error("Error fetching orders data:", error);
            res.status(500).json({ message: "Error fetching orders data" });
        }
    }

    // Get ledger data for chart
    // getLedgerDataAPI: async (req, res) => {
    //     try {
    //         const dateRange = req.query.dateRange || "30";
    //         const days = dateRange === "all" ? Infinity : parseInt(dateRange);
    //         const startDate = days === Infinity ? new Date(0) : new Date(new Date().setDate(new Date().getDate() - days));

    //         const ledgerStats = await orderSchema.aggregate([
    //             { $match: { orderDate: { $gte: startDate }, status: { $nin: ["cancelled", "returned"] } } },
    //             { $group: { _id: null, revenue: { $sum: "$amountPaid" } } }
    //         ]);

    //         const revenue = ledgerStats[0]?.revenue || 0;
    //         const expenses = 0; // Modify if needed
    //         const profit = revenue - expenses;

    //         res.json({ revenue, expenses, profit });
    //     } catch (error) {
    //         console.error("Error fetching ledger data:", error);
    //         res.status(500).json({ message: "Error fetching ledger data" });
    //     }
    // }
};


module.exports = dashboardController;