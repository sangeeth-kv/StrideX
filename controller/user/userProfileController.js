const addressSchema=require("../../model/addressModel")
const userSchema=require("../../model/userModel")
const orderSchema=require("../../model/orderModel")
const walletSchema=require("../../model/walletModel")
const crypto = require("crypto");
const {sendOTPByEmail}=require("../../controller/user/otpverification")
const saltRounds=10;
const bcrypt=require("bcrypt")

const generateOTP=()=>crypto.randomInt(100000, 999999).toString();

const userProfileController={
    loadProfilePage:async (req,res) => {
        try {
            const userId=req.session.user?.id
           

            const user=await userSchema.findById(userId)
            if(!user){
                return res.redirect("/user/login?error=User not found");
            }
           

             let wallet=await walletSchema.findOne({userId})
            
                if (!wallet) {
                // If wallet doesn't exist, create one
                wallet = await walletSchema.create({ userId, balance: 0, transactions: [] });
                }

            const addresses = await addressSchema.find({ userId, isDeleted: false });
            const orders = await orderSchema
            .find({ userId }) 
            .populate('items.productId', 'name');

            console.log(wallet)
            res.render("user/userprofile",{user,addresses,orders,wallet})
        } catch (error) {
            console.log(error)
        }
    },
    uploadImage:async (req,res) => {
        try {
            const userId=req.session.user?.id
            const user=await userSchema.findById(userId)

            if(!user){
                return res.status(404).json({message:"User not found"})
            }
            const imageUrl=req.file ? `/uploads/${req.file.filename}`:"";

            await userSchema.findByIdAndUpdate(userId, {image:imageUrl});

            return res.status(200).json({message:"Profile pic updated",success:true})
        } catch (error) {
            console.log(error)
        }
    },
    loadEmailOtpPage:async (req,res) => {
        const id=req.params.id
        const user=await userSchema.findById(id)
        if(!user){
            return res.redirect("/user/login?error=User not found");
        }
        const otp= generateOTP();
        console.log(otp);
        
        const expiresAt = Date.now() + 60 * 1000; // Set expiration time (1 minute)
        req.session.otpData = { otp, expiresAt };
        await sendOTPByEmail(user.email,otp)
        res.render("user/changeemailOtp")
    },verifyEmailOtp:async (req,res) => {
        try {
            console.log("conmmes");
            
            const otp=req.body.otp
            const otpData=req.session.otpData
            console.log("session otp",otpData.otp+"  "+"user enter otp",otp)

            if (Date.now() > otpData.expiresAt) {
                req.session.otpData = null; // Clear expired OTP
                return res.status(400).json({ message: "OTP expired. Please request a new one." });
            }

            if(otpData.otp!=otp){
                return res.status(401).json({status:"false",message:"Invalid otp!"})
            }

            return res.status(200).json({status:"success",message:"Otp verified",redirectUrl:"/user/change-email"})

        } catch (error) {
            console.log(error)
        }
    },loadChangeEmailPage:async (req,res) => {
        try {
            const id=req.session.user?.id
            
            
            res.render("user/changeEmail")
            
        } catch (error) {
            console.log(error)
        }
    },
    changeEmail:async (req,res) => {
        try {
            console.log("you here...");
            const email=req.body.email
            console.log("user enter email"+email);
            
            const id=req.session.user?.id
            const user=await userSchema.findById(id)
            if(!user){
                return res.status(404).json({message:"User not found!!!",redirectUrl:"/user/login"})
            }
            if(user.email==email){
                return res.status(409).json({message:"You enter the current email",redirectUrl:"/user/change-email"})
            }

            const existingUser = await userSchema.findOne({ email });

            if (existingUser) {
            return res.status(409).json({ message: "This email is already in use", redirectUrl: "/user/change-email" });
            }

            user.email = email;
            await user.save(); // Save the updated email

            console.log("updaed email"+user.email);
            

            console.log(user);
            res.status(200).json({message:"User updated successfully..",redirectUrl:`/user/view-profile/${id}`})
        } catch (error) {
            console.log(error)
        }
    },
    resendOtpforEmail:async (req,res) => {
        try {
            const id=req.session.user?.id
            const user=await userSchema.findById(id)

            const otp=generateOTP()
            console.log(otp);

            const expiresAt = Date.now() + 60 * 1000; // Set expiration time (1 minute)
            req.session.otpData = { otp, expiresAt };
            await sendOTPByEmail(user.email,otp)
            return res.status(200).json({status:"success",message:"Otp sent successfully..!"})
        } catch (error) {
            console.log(error)
        }
    },
    checkCurrentPassword:async (req,res) => {
        try {
            const id=req.session.user?.id
            const currentPassword=req.body.password
            console.log("this is req.body : ",req.body)
            console.log(currentPassword);
            
            
            console.log(id);

            if(!id){
               return res.status(401).json({message:"Session expires!"})
            }

            const user=await userSchema.findById(id)
            console.log(user.password);

            if(!user){
               return res.status(401).json({message:"User not found.!"})
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if(!isMatch){
                return res.status(401).json({message:"Wrong password"})
            }

            return res.status(200).json({success:true,message:"Password verified successfully..!"})
            
        } catch (error) {
            console.log(error)
        }
    },changeUserpasswordOtpPage:async (req,res) => {
        try {
            const id=req.session.user?.id
            
            if(!id){
                return res.status(401).json({message:"Session time out"})
            }

            const user=await userSchema.findById(id)

            if(!user){
                return res.status(401).json({message:"No user found"})
            }
            const otp= generateOTP();
            console.log(otp);
            
            const expiresAt = Date.now() + 60 * 1000; // Set expiration time (1 minute)
            req.session.otpData = { otp, expiresAt };
            await sendOTPByEmail(user.email,otp)
            res.render("user/changepasswordotp")
        } catch (error) {
            console.log(error)
        }
    },
    
    verifyOtpChangePassword:async (req,res) => {
        try {
            const otp=req.body.otp
            const otpData=req.session.otpData
            console.log("session otp",otpData.otp+"  "+"user enter otp",otp)

            if (Date.now() > otpData.expiresAt) {
                req.session.otpData = null; // Clear expired OTP
                return res.status(400).json({ message: "OTP expired. Please request a new one." });
            }

            if(otpData.otp!=otp){
                return res.status(401).json({status:"false",message:"Invalid otp!"})
            }

            return res.status(200).json({status:"success",message:"Otp verified",redirectUrl:"/user/change-user-password"})
            


        } catch (error) {
            console.log(error)
        }
    },
    changeUserPasswordPage:async (req,res) => {
        try {
            res.render("user/changeuserpassword")
        } catch (error) {
            console.log(error)
        }
    },
    verifyNewPassword:async (req,res) => {
        try {
            const id=req.session.user?.id

            const password=req.body.password

            if(!id){
                return res.status(401).json({message:"Session expired..!"})
            }

            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

            if (!passwordRegex.test(password)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character." 
                });
            }
            const user=await userSchema.findById(id)

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found!" });
            }

            const hashedPassword = await bcrypt.hash(password,saltRounds);
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({ success: true, message: "Password updated successfully!" ,redirectUrl:`/user/view-profile/${id}`});
        } catch (error) {
            console.log(error)
        }
    },
   
    
}

module.exports=userProfileController