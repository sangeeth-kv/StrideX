const adminEnsure=async (req,res,next) => {
    try {
        // Check if the admin session exists and the user is actually an admin
        if (!req.session.admin || !req.session.admin.isAdmin) {
            return res.redirect("/user/home");
        }
        next(); // Allow access to admin routes if the user is an admin
    } catch (error) {
        console.error("Error in adminEnsure middleware:", error);
        res.status(500).send("Internal Server Error");
    }
}
module.exports=adminEnsure