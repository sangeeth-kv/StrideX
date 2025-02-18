const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  brand: { type: String, required: true },
  offer: { type: Number, default: 0 },
  images: [String],
  stock: { type: Number, default: 0 },
  variants: [
    {
      color: { type: String, required: true },
      images: [String],
      sizes: [
        {
          size: { type: Number, required: true },
          regularPrice: { type: Number, required: true },
          salePrice: { type: Number, required: true },
          quantity: { type: Number, required: true },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Product", productSchema);
