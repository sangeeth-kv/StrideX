const userSchema=require("../../model/userModel")
const couponSchema=require("../../model/coupenModel")


const referralController={
    applyReferral:async (req,res) => {
        try {
            console.log("req body of apply refferal : ",req.body)
            const referralCode=req.body.referralCode
            const userId=req.session.user?.id
            console.log(userId)
            const user=await userSchema.findById(userId)
            console.log("this is user : ",user)

            

            if(!referralCode){
                return res.status(404).json({message:"Invalid refferal code"})
            }
            let referrer = await userSchema.findOne({ referralCode: referralCode });

            if(!referrer){
                return res.status(404).json({message:"No referrar found..!"})
            }

            const existingCoupon = await couponSchema.findOne({ name: `REFERRAL-100${req.session.user.fullname}`, userId });
        if (existingCoupon) {
            return res.status(400).json({ message: "Referral code already applied!" });
        }
        const referedUser=await userSchema.findOne({referralCode:referralCode})
        console.log("refered : ",referedUser)

            const newCoupon = new couponSchema({
                name: `welcome-100${user.fullname}`,
                expireOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
                offerPrice: 100, // ₹100 coupon
                minimumPrice: 500, // Can be used on orders above ₹500
                userId: [req.session.user?.id], // Assign the coupon to the new user
                referedBy:[referedUser._id]
            });
            await newCoupon.save();
           
            
            const referrCoupon=new couponSchema({
                name: `RewardForRefered-100${user.fullname}`,
                expireOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
                offerPrice: 100, // ₹100 coupon
                minimumPrice: 500, // Can be used on orders above ₹500
                userId: [referedUser._id],
            })


            await referrCoupon.save();
            res.status(200).json({message:"Referral applied successfully..!",success:true})
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=referralController