const userEnsure=async (req,res,next) => {
   try {
    if (!req.session.user || !req.session.user.id) {
        return res.redirect("/admin/dashboard");
    }
    next();
   } catch (error) {
    console.log(error)
   }
}

module.exports=userEnsure