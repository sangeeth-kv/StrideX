const walletSchema=require("../../model/walletModel")


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
                { $unwind: "$transactions" }, // Flatten transactions array
                { $sort: { "transactions.date": -1 } }, // Sort by latest transaction
                { $skip: skip }, // Skip based on page
                { $limit: limit }, // Limit results
                {
                    $lookup: {
                        from: "users", // Join with User collection
                        localField: "userId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                { $unwind: "$userDetails" }, // Convert userDetails array into object
                {
                    $project: {
                        _id: 0,
                        "transactions": 1,
                        "userDetails.fullname": 1
                    }
                }
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
    }
}
module.exports=adminWalletController