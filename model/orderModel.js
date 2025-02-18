const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  paymentMethod: { type: String, required: true },
  orderDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
  address: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
  transactionId: { type: String },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
  total: { type: Number, required: true },
  deliveredDate: { type: Date },
});

module.exports = mongoose.model("Order", orderSchema);
