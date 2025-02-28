

const authMiddlewire={
    isAuthenticated:(req,res,next)=>{
        if(req.session.user){
            next();
        }else{
            res.redirect("/user/login")
        }
    },
    isBlocked:(req,res,next)=>{
        if(req.session.user&&req.session.user.isACtive){
            req.session.destroy()
            return res.render("user/login", { messages: "User is blocked" })
        }else{
            next(); 
        }
    }
}