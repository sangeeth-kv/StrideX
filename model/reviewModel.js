const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  review: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
});

module.exports = mongoose.model("Review", reviewSchema);
