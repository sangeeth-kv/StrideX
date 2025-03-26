const reviewSchema=require("../../model/reviewModel")
const mongoose=require("mongoose")


const reviewController={
 addReviews:async (req,res) => {
    try {
        console.log("req body of add reviews controller : ",req.body)
        const {productId,rating,review}=req.body
        console.log("user id ",req.session.user)
        const userId=req.session.user?.id
        if(!userId){
            return res.status(404).json({message:"User session expired. Please log in again. expired"})
        }
        if (!productId || !rating || !review) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5 stars." });
        }
        const newReview = new reviewSchema({
            userId,
            productId,
            rating,
            review,
            date: new Date(), // Automatically set to current date
        });

        await newReview.save();
        console.log("Review added successfully!");
        return res.status(201).json({ message: "Review submitted successfully!", success:true});


    } catch (error) {
        console.log(error)
    }
 },
 editReview:async (req,res) => {
    try {
        console.log("this is req body of edit review : ",req.body)
        const {reviewId,rating,review,productId}=req.body
        if(!reviewId){
            return res.status(404).json({message:"Review not found"})
        }

        await reviewSchema.findByIdAndUpdate( new mongoose.Types.ObjectId(reviewId),{
            review:review,
            rating:rating
        })

        return res.status(200).json({message:"Review updated",success:true})

    } catch (error) {
        console.log(error)
    }
 },
 deleteReview:async (req,res) => {
    try {
        console.log("req body of delete review : ",req.body)
        const reviewId=req.body.reviewId
        console.log("review : ",reviewId)
        const deletedReview = await reviewSchema.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        console.log("order deleted")
        return res.status(200).json({message:"Review deleted successfully",success:true})
    } catch (error) {
        console.log(error)
    }
 }  
}

module.exports=reviewController