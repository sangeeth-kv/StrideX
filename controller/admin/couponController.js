const couponSchema=require("../../model/coupenModel")


const couponController={
    loadCouponPage:async (req,res) => {
        try {
            let page = parseInt(req.query.page) || 1; // Default to page 1
            let limit = 5; // Number of categories per page
            let skip = (page - 1) * limit;
            const searchQuery=req.query.search?req.query.search.trim():"";
            let filter={}
            if(searchQuery){
                filter.name={$regex:new RegExp(searchQuery,"i")};
            }
            const totalCoupons= await couponSchema.countDocuments(filter); // Total count
            const totalPages = Math.ceil(totalCoupons / limit);
            const coupons=await couponSchema.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            res.render("admin/coupon",{
                coupons,
                currentPage: page,
                totalPages,
                search:searchQuery,})
        } catch (error) {
           console.log(error) 
        }
    },
    addCoupon:async (req,res) => {
        try {
            console.log( "add coupon req.body : ",req.body)
            const { couponName,startDate,endDate, offerPrice, minimumPrice}=req.body

            const existingCoupon = await couponSchema.findOne({ name: { $regex: new RegExp(`^${couponName}$`, "i") } });
            if(existingCoupon){
                return res.status(400).json({message:"Coupon already exists"})
            }

            const newCoupon = new couponSchema({
                name: couponName,
                createdOn: new Date(),
                expireOn: new Date(endDate),
                offerPrice: offerPrice,
                minimumPrice: minimumPrice
            });

            await newCoupon.save();
            res.status(201).json({ success: true, message: "Coupon added successfully!", coupon: newCoupon });

        } catch (error) {
         console.log(error)   
        }
    },loadEditCouponPage:async (req,res) => {
        try {
            const couponId=req.query.id
            console.log("coupeon id from req.body",couponId)
            const coupon=await couponSchema.findById(couponId)
            res.render("admin/editcoupon",{coupon})
        } catch (error) {
           console.log(error) 
        }
    },
    updateCoupon:async (req,res) => {
        try {
            console.log("this is update coupon req.body : ",req.body)
            const {couponId, couponName, startDate, endDate,offerPrice,minimumPrice}=req.body
            await couponSchema.findByIdAndUpdate(couponId,{
                name: couponName,
                createdOn: new Date(startDate),
                expireOn: new Date(endDate),
                offerPrice,
                minimumPrice,
            })
            res.status(200).json({ message: "Coupon updated successfully" ,success:true});
        } catch (error) {
            console.log(error)
        }
    },
    toggleCouponStatus:async (req,res) => {
       try {
        console.log("req params of togglecouponStatus : ",req.params)

        const couponId=req.params.id

        const updatedCoupon = await couponSchema.findById(couponId);

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        updatedCoupon.isList = !updatedCoupon.isList 

        await updatedCoupon.save()

        res.json({ success: true, message: "Coupon status updated successfully" });

       } catch (error) {
        console.log(error)
       }
    }
}

module.exports=couponController