const adminMiddleware={
    isLogin:async (req,res,next) => {
        if(req.session.admin){
            next()
        }else{
            res.redirect("/admin/login")
        }
    }
}

module.exports=adminMiddleware