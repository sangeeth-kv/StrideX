const crypto=require("crypto")
const nodemailer=require("nodemailer");
const userSchema=require("../../model/userModel")



// const sentOTPByEmail=nodemailer.createTransport({
//     service:"gmail",
//     auth:{
//         user:"sangeethkvdevelops@gmail.com",
//         pass:"hfwe tigu cewv cpcs"
//     }
// });

const sendOTPByEmail = async (email, otp) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "sangeethkvdevelops@gmail.com", // Replace with your email
                pass: "ocux rbfm zykq fzio", // Replace with your app password
            },
        });

        let mailOptions = {
            from: "sangeethkvdevelops@gmail.com",
            to: email,
            subject: "Your OTP for Signup",
            text: `Your OTP is ${otp}. It will expire in 1 minute.`,
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};





module.exports={
    sendOTPByEmail,
}