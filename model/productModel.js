const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
  // offer: { type: Number, default: 0 },
  images: [String],
  isActive : {type : Boolean,default : true},
  variants : [
    {
        size : {
            type : String,
            required : true,
        },
        regularPrice :{
            type : Number,
            required : true,
            min : [0,"Regular price cannot be negative"],
        },
        quantity:{
            type : Number,
            required : true,
            min : [0, "Quantity cannot be negative"]
        },
    },
],
},
{timestamps : true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model("Product", productSchema);
