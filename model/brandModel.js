const mongoose = require("mongoose");

// Brand Schema
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String },
  description: { type: String },
  isListed:{type:Boolean,default:true}
},
{timestamps : true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model("Brand", brandSchema);

