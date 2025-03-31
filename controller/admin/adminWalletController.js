const adminEnsure = require("../../middlewares/adminEnsure")
const walletSchema=require("../../model/walletModel")
const adminSchema=require("../../model/adminModel")

const adminWalletController={
    loadWalletPage:async (req,res) => {
        try {
            let page=parseInt(req.query.page)||1
            let limit=5
            let skip = (page-1) * limit
            console.log("page :",page,"req.quey page : ",req.query.page)
            
            

            const totalTransactions = await walletSchema.aggregate([
                { $unwind: "$transactions" },
                { $count: "total" }
            ]);
            const totalPages = Math.ceil((totalTransactions[0]?.total || 0) / limit);
            const wallet = await walletSchema.aggregate([
                { $unwind: "$transactions" }, 
                { $sort: { "transactions.date": -1 } }, 
                { $skip: skip }, 
                { $limit: limit },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                { $unwind: "$userDetails" }, 
                {
                    $project: {
                        _id: 0,
                        "transactions": 1,
                        "userDetails.fullname": 1
                    }
                },
                {
                    $lookup: {
                        from: "orders", 
                        localField: "transactions.orderId",
                        foreignField: "_id",
                        as: "orderDetails"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        "transactions": 1,
                        "userDetails.fullname": 1,
                        "orderDetails": { $arrayElemAt: ["$orderDetails", 0] }
                    }
                },
                

            ]);
            console.log("this is wallet : ",wallet)
            console.log("totol transction : ",totalTransactions)
            console.log("total page : ",totalPages)

          

           
            res.render("admin/walletpage",{wallet, currentPage: page,totalPages: totalPages > 0 ? totalPages : 1})
        } catch (error) {
            console.log(error)
        }
    },
    loadTransactionPage:async (req,res) => {
        try {
            console.log("req params : ",req.params)
            console.log("loadTransaction page>>")
            const transactionId=req.params.id


            

            const transaction = await walletSchema.findOne({ "transactions.transactionId": transactionId },
                { "transactions.$": 1, userId: 1 }) // Get only the matching transaction
    
            .populate("userId", "fullname email");

            console.log("this is transaction : ",transaction)

            // if (!transaction) {
            //     return res.status(404).send("Transaction not found");
            // }

            res.render("admin/transactiondetails", { transaction: transaction.transactions[0], user: transaction.userId });
        } catch (error) {
            console.log(error)
        }
    },
    loadCreditsPage:async (req,res) => {
        try {

            const adminEmail=req.session.admin?.id
            console.log(req.session.admin)
            const admin=await adminSchema.findOne({email:adminEmail})
            const adminId=admin?._id
            const adminWallet = await walletSchema.aggregate([
                { $match: { adminId: adminId } }, // Filter for admin wallet
                { $unwind: "$transactions" }, // Flatten transactions array
    
                // Lookup order details using orderId
                {
                    $lookup: {
                        from: "orders",
                        localField: "transactions.orderId",
                        foreignField: "_id",
                        as: "orderDetails"
                    }
                },
                { $unwind: { path: "$orderDetails", preserveNullAndEmptyArrays: true } },
    
                // Lookup user details using userId from orderDetails
                {
                    $lookup: {
                        from: "users",
                        localField: "orderDetails.userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    
                // Merge user fullname into transactions object
                {
                    $addFields: {
                        "transactions": {
                            $mergeObjects: ["$transactions", { userFullname: "$userDetails.fullname" }]
                        }
                    }
                },
    
                // Project final output
                {
                    $project: {
                        _id: 0,
                        transactions: 1
                    }
                }
            ]);
            console.log("admin wallet :",adminWallet)
            console.log("admin transactions : ",adminWallet.transactions)

            res.render("admin/creditspage",{wallet:adminWallet})
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports=adminWalletController