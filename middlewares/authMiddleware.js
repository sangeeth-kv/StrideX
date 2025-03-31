

const userSchema=require("../model/userModel")
const authMiddlewire={
    isAuthenticated:(req,res,next)=>{
        if(req.session.user ){
            next();
        }else{
            res.redirect("/user/login")
            return res.status(404).json({message:"YOu need to login first"})
        }
    },
    isBlocked: async (req, res, next) => {
        if (req.session.user) {
            const user = await userSchema.findOne({email:req.session.user.email});
            console.log("user in middle ware : ",user)
            if (!user || user.isActive === false) { // ✅ Fetch user & check isActive status
                req.session.destroy();
                return res.render("user/login", { messages: "User is blocked" });
            }
        }
        next();
    }
}

module.exports=authMiddlewire