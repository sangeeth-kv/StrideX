const mongoose = require("mongoose");
const crypto = require("crypto");


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,  // Ensure unique emails
    },
    password: {
        type: String,
        required: false,  // ✅ Change to optional for Google OAuth users
    },
    fullname: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: Number,
        required: false,  // ✅ Change to optional
    },
    googleId: {
        type: String,
        unique: true, // ✅ Ensure unique Google ID
        sparse: true, // ✅ Allows non-Google users to have null Google ID
    },
    isActive:{
        type:Boolean,
        default:true,
    },
    image: { type: String },
    referralCode: { type: String, unique: true },
    
},
{timestamps : true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.pre("save", function (next) {
    if (!this.referralCode) {
        this.referralCode = generateReferralCode(this.email);
    }
    next();
});
function generateReferralCode(email) {
    return crypto.createHash("md5").update(email + Date.now()).digest("hex").substring(0, 8).toUpperCase();
}

module.exports = mongoose.model("User", userSchema);
