const mongoose=require("mongoose")
const adminSchema=new mongoose.Schema({
    email:{
        type:String,
        requried:true
    },
    password:{
        type:String,
        required:true
    },
    isAdmin:{type:Boolean,default:true}
})
module.exports=mongoose.model("admin",adminSchema)