    const mongoose = require("mongoose");

    const categorySchema = new mongoose.Schema({
      name: { type: String, required: true },
      offer: { type: Number, default: 0 },
      image: { type: String }, // Optional: Store logo URL
      description: { type: String, required: true },
      isListed:{type:Boolean,default:true}
    },
    
    {timestamps : true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    });

    module.exports = mongoose.model("Category", categorySchema);
