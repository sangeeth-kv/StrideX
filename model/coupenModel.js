const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ["percent", "fixed"], required: true },
  discountValue: { type: Number, required: true },
  minimumPurchase: { type: Number, required: true },
  startingDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Coupon", couponSchema);
