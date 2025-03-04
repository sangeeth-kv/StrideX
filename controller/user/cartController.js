const cartSchema=require("../../model/cartModel")

const cartController={

    addToCart:async (req,res) => {
        try {
            const {productId}=req.body
            console.log(productId,"hi")

            const userId=req.session.userId
            
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=cartController