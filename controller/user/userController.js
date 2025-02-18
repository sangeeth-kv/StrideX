const userSchema=require("../../model/userModel")
const bcrypt=require("bcrypt")
const crypto = require("crypto");
const {sendOTPByEmail}=require("../../controller/user/otpverification")
const saltRounds=10;

const generateOTP=()=>crypto.randomInt(100000, 999999).toString();


const userController={
        loadLogin:async (req,res) => {
        try {
            res.render("user/login", { messages:"you have to enter.."});
        } catch (error) {
            console.log(error)
        }
    },
    loadSignup:async (req,res) => {
        try {
            res.render("user/signup")
        } catch (error) {
            
        }
    },
    signUp: async (req, res) => {
        try {
          
            const { fullname, phoneNumber, email, password, confirmPassword } = req.body;
            // const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            const phoneRegex = /^[6-9]\d{9}$/; // Validates a 10-digit Indian phone number starting with 6-9
           
    
            // Validation
            // Check if all fields are provided
            if (!fullname || !phoneNumber || !email || !password || !confirmPassword) {
                return res.status(401).json({
                    message: 'Must fill all fields!',
                    status: 'error',
                    data: { fullname, phoneNumber, email }
                });
            }
            if (!fullname?.trim() || !phoneNumber?.trim() || !email?.trim() || !password?.trim() || !confirmPassword?.trim()) {
                return res.status(401).json({
                    message: 'Must fill all fields!',
                    status: 'error',
                    data: { fullname, phoneNumber, email }
                });
            }
    
            // Validate email format
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    message: 'Please enter a valid email !',
                    status: 'error',
                    data: { fullname, phoneNumber }
                });   
            }
            if(!phoneRegex.test(phoneNumber)){
                return res.status(400).json({
                    message:'please enter a valid phone number',
                    status:'error',
                    data:{fullname,email}
                })
            }
    
            // Validate password and confirm password match
            if (password !== confirmPassword) {
                return res.status(400).json({
                    message: 'password and confirm password must match !',
                    status: 'error',
                    data: { fullname, phoneNumber, email }
                })
               
            }
    
            // Validate password strength
            if (!passwordRegex.test(password)) {
                return res.status(401).json({
                    message: 'Password must contain at least 8 characters, including letters, numbers, and special characters',
                    status: 'error',
                    data: { fullname, phoneNumber, email }
                });
            }
            //here want to check if the user is existing or not!!!!!!!!!!!!!!!!!!!!!!!
            // const existingUser=await userSchema.findOne({email})
            const existingUser = await userSchema.findOne({ 
                $or: [{ email }, { phoneNumber }]
            });
            // console.log(existingUser)
           if(existingUser){
            // return res.render("user/login",{message:`You have already sigined using the email or phone number`,type:"error"})
            return res.status(409).json({
                message: 'You have already sigined using the email or phone number',
                status: 'error',
                data: { fullname }
            });
           }

            const otp = generateOTP();
            console.log(otp)
            await sendOTPByEmail(email,otp)
            
            const hashedPassword=await bcrypt.hash(password,saltRounds)
            req.session.otp=otp
            req.session.email=email
            req.session.password=password
            req.session.fullname=fullname
            req.session.phoneNumber=phoneNumber
            req.session.password=hashedPassword
            // const otpToken = jwt.sign({ email, otp }, process.env.JWT_SECRET, { expiresIn: "1m" });
            // console.log("this si otp toke  "+otpToken)
            // // const dedo=jwt.verify()
            // const decod=jwt.decode(otpToken,process.env.JWT_SECRET)
            // console.log("dedoo"+" "+decod)

        //    return res.status(200).json({ status: "success", message: "OTP sent" });
           

           return res.status(200).json({ status: "success", message: "OTP sent"});

        } catch (error) {
            console.error("Signup error:", error);
            return res.render("user/signup", { message: "Something went wrong!", type: "error" });
        }
    },loadOTPPage: async (req, res) => {
        try {
            res.render(`user/otpform`);
        } catch (error) {
            console.error("Error loading OTP page:", error);
            res.redirect(`/user/signup`);
        }
    },
    verifyOTP:async (req,res) => {
        try {
            console.log("verfiyuy");
            
            const otp=req.session.otp
            console.log("this is req,bodyy"+req.body)
            const email=req.session.email
            const userOtp=req.body.otp
            console.log("this is user enter otp : "+userOtp)
            console.log("session otp : "+otp)

            if(!email){
                return res.status(401).json({ status: "error", message: "No user email found"})
            }

            if(otp!=userOtp){
                return res.status(400).json({ status: "error", message: "Invalid OTP entered" })
            }

            const existingUser=await userSchema.findOne({email})
            if(existingUser){
                return res.status(200).json({
                    status: "success", 
                    message: "You are logging in..!", 
                    redirectUrl: "/user/change-password"
                });                
            }

            
                    // //here creating new user
                    const newUser = new userSchema({
                        fullname: req.session.fullname,
                        email: req.session.email,
                        phoneNumber: req.session.phoneNumber,
                        password: req.session.password,
                     });
                     
            newUser.save();

            return res.status(201).json({status:"success",message:"Otp verified"})       
            
        } catch (error) {
            console.log(error)
        }
    },
    resendOTP:async (req,res) => {
        try {
            const newOtp= generateOTP();
            req.session.otp = newOtp;
            console.log("new otp is here : "+newOtp)
            res.status(200).json({ message: "New OTP sent successfully." });

        } catch (error) {
            console.log(error.message)
        }
    },
    forgotPassword:async (req,res) => {
        try {
            const {email}=req.body
            console.log("forgot password email"+email)
            const existuser=await userSchema.findOne({email})
            console.log("this is  databse emai"+existuser)
            // if(existuser==email){
            //     const otp=generateOTP()
            //     console.log(otp)
            //     req.session.otp=otp
            //     res.status(200).json({redirectUrl:"/user/verify"})
            // }
            if(!existuser){
                 return res.status(401).json({message:"No account found using this email..!"})
            }
            const otp=generateOTP()
            await sendOTPByEmail(email,otp)
            console.log("otp newly created...!!!!"+otp)
            req.session.otp=otp
            req.session.email=email
            console.log(req.session.otp+"session stored otp")
            console.log(req.session.email+"session stored email")
            //here i want to add something..

           return res.status(200).json({status:"success",message:"otp sent to your email account",redirectUrl:"/user/verify-otp"})
        } catch (error) {
            console.log(error.message)
        }
    },
    loadVerify:async (req,res) => {
        res.render("user/otpform")
    },
    loadChangePassword:async (req,res) => {
        res.render("user/changepassword")
    },
    changePassword:async (req,res) => {
       try {
        const {newPassword,confirmPassword,email}=req.body

        if (!email) {
            return res.status(401).json({ status: "error", message: "Session expired. Please try again." });
        }
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!newPassword?.trim() || !confirmPassword?.trim()) {
            return res.status(401).json({
                message: 'Must fill all fields!',
                status: 'error',
            });
        }
        if (!passwordRegex.test(newPassword)) {
            return res.status(401).json({
                message: 'Password must contain at least 8 characters, including letters, numbers, and special characters',
                status: 'error',
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'password and confirm password must match !',
                status: 'error',
            })
           
        }

        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found", status: "error" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        await user.save();

        req.session.email = null;
        req.session.otp = null;

        return res.status(200).json({ status: "success", message: "Password updated successfully! Please log in with your new password.", redirectUrl: "/user/login" });

        
       } catch (error) {
        console.error("Error in changePassword:", error); // Log error in console
        return res.status(500).json({ status: "error", message: "Internal Server Error" });
       }

    },
    

    // signUp: async (req, res) => {
    //     try {
    //         const { fullname, phoneNumber, email, password, confirmPassword } = req.body;
    //         console.log(`${fullname} ${phoneNumber} ${email} ${password} ${confirmPassword}`);
    
    //         // Regular expressions for validation
    //         const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    //         const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    //         const phoneRegex = /^[6-9]\d{9}$/; // Validates a 10-digit Indian phone number starting with 6-9
    
    //         // Check if all fields are provided
    //         // if (!fullname || !phoneNumber || !email || !password || !confirmPassword) {
    //         //     return res.status(401).json({
    //         //         message: 'Must fill all fields!',
    //         //         status: 'error',
    //         //         data: { fullname, phoneNumber, email }
    //         //     });
    //         // }
    //         if (!fullname?.trim() || !phoneNumber?.trim() || !email?.trim() || !password?.trim() || !confirmPassword?.trim()) {
    //             return res.status(401).json({
    //                 message: 'Must fill all fields!',
    //                 status: 'error',
    //                 data: { fullname, phoneNumber, email }
    //             });
    //         }
    
    
    //         // Validate email format
    //         if (!emailRegex.test(email)) {
    //             // return res.render("user/signup", { 
    //             //     message: "Please enter a valid email", 
    //             //     type: "error",
    //             //     fullname, phoneNumber, email
    //             // });
    //             return res.status(400).json({
    //                 message: 'Please enter a valid email !',
    //                 status: 'error',
    //                 data: { fullname, phoneNumber }
    //             });
    //         }if(!phoneRegex.test(phoneNumber)){
    //             return res.status(400).json({
    //                 message:'please enter a valid phone number',
    //                 status:'error',
    //                 data:{fullname,email}
    //             })
    //         }
    
    //         // Validate password and confirm password match
    //         if (password !== confirmPassword) {
    //             // return res.render("user/signup", { 
    //             //     message: "Passwords do not match", 
    //             //     type: "error",
    //             //     fullname, phoneNumber, email
    //             // });
    //             return res.status(400).json({
    //                 message: 'password and confirm password must match !',
    //                 status: 'error',
    //                 data: { fullname, phoneNumber, email }
    //             });
    //         }
    
    //         // Validate password strength
    //         if (!passwordRegex.test(password)) {
    //             // return res.render("user/signup", { 
    //             //     message: "Password must contain at least 8 characters, including letters, numbers, and special characters", 
    //             //     type: "error",
    //             //     fullname, phoneNumber, email
    //             // });
    //             return res.status(401).json({
    //                 message: 'Password must contain at least 8 characters, including letters, numbers, and special characters',
    //                 status: 'error',
    //                 data: { fullname, phoneNumber, email }
    //             });
    //         }
    //         //here want to check if the user is existing or not!!!!!!!!!!!!!!!!!!!!!!!
    //         // const existingUser=await userSchema.findOne({email})
    //         const existingUser = await userSchema.findOne({ 
    //             $or: [{ email }, { phoneNumber }]
    //         });
    //         // console.log(existingUser)
    //        if(existingUser){
    //         // return res.render("user/login",{message:`You have already sigined using the email or phone number`,type:"error"})
    //         return res.status(409).json({
    //             message: 'You have already sigined using the email or phone number',
    //             status: 'error',
    //             data: { fullname }
    //         });
    //        }

    //        //OTP sending to user

    //        const otp = generateOTP();
    //        const otpExpiresAt = new Date(Date.now() + 60000);

    //        req.session.tempUser = {
    //         fullname,
    //         email,
    //         phoneNumber,
    //         password, // Store unhashed password (we will hash after OTP verification)
    //         otp: { code: otp, expiresAt: otpExpiresAt }
    //     };
    
    //         // Proceed with further processing, such as storing the user in the database
    //         // Example: await User.create({ fullname, phoneNumber, email, password });
    //         // const hashedPassword=await bcrypt.hash(password,saltRounds)
    //         // //here creating new user
    //         // const newUser=new userSchema({
    //         //     fullname,
    //         //     email,
    //         //     phoneNumber,
    //         //     password:hashedPassword,
    //         //     otp:{code:otp,expiresAt:otpExpiresAt}
    //         // })
    //         // await newUser.save();
            

    //         await sendOTPByEmail(email,otp)


    //         // return res.status(201).json({
    //         //     message: "Signup successful! Redirecting to login...",
    //         //     status: "success",
    //         //     redirectUrl: "/user/login"
    //         // });
    //         return res.status(201).json({ message: "OTP sent. Verify to continue.", status: "success", email });

    //         //otp sending to user ends heree...

    //         // return res.render("user/login", { message: "Signup successful", type: "success" });
    //     } catch (error) {
    //         console.error("Error in signUp function:", error);
    //         return res.render("user/signup", { message: "An error occurred. Please try again later.", type: "error" });
    //     }
    // },
   
    // signIn:async (req,res) => {
    //    try {
    //     console.log(req.body)
    //     const {email,password}= req.body
    //     if (!email || !password){
    //         return res.render("user/login",{message:"Enter all fields to continue",type:"error",email})
    //     }
    //     const user=await userSchema.findOne({email})
    //     console.log(user)
    //     if(!user){
    //         return res.render("user/login",{message:"You dont have any account,Please login for continue",type:"error"})
    //     }
    //     const isMatch=await bcrypt.compare(password,user.password)
    //     console.log(isMatch)
    //     if(!isMatch){
    //         return res.render("user/login",{message:"Password doesnot match",type:"error",email})
    //     }
    //     res.render("user/home")

    //    } catch (error) {
    //     console.log(error)
    //    }
    // },
    signIn:async (req,res) => {
        try {
         console.log(req.body)
         const {email,password}= req.body
         const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
         if (!email || !password ){
            return res.status(400).json({
                message: 'Must fill all fields !',
                status: 'error',
                data: {  email,password }
            });
         }
         
         if(!emailRegex.test(email)){
            return res.status(400).json({
                message: 'Enter valid email !',
                status: 'error',
                data: {  email,password }
            });
         }

         const user=await userSchema.findOne({email})
         console.log(user)
         if(!user){
            //  return res.render("user/login",{message:"You dont have any account,Please login for continue",type:"error"})
            return res.status(400).json({
                message: 'No registered account,need to sign up first!',
                status: 'error',
                data: {email }
            });
         }
         const isMatch=await bcrypt.compare(password,user.password)
         console.log(isMatch)
         if(!isMatch){
            return res.status(400).json({
                message: 'Incorrect password !',
                status: 'error',
                data: { email }
            });
         }
         return res.status(201).json({
            message: "Signin successful! Redirecting to home page..",
            status: "success",
            redirectUrl: "/user/home"
        });
 
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error",
                status: "error",
            });
        }
     },
    loadHome:async (req,res) => {
        res.render("user/home")
        
    },
 
    
}

module.exports=userController