const adminModel=require("../../model/adminModel")
const bcrypt=require("bcrypt")




const adminController={
login:async (req,res) => {
res.render("admin/login")
},
postLogin: async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);

        const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email !',
                status: 'error',
            })
        }
        const admin = await adminModel.findOne({ email });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Wrong email address" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password" });
        }

        // Here, you may generate a JWT token if needed and send it back
        return res.status(200).json({ success: true, message: "Login successful" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
},

}
module.exports=adminController
