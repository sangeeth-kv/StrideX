const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true }, // UUID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  paymentMethod: { type: String, required: true },
  orderDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "processing", "shipped","delivered", "cancelled","return request","returned",], default: "pending" },
  address: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      size: { type: String, required: true }, 
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  transactionId: { type: String },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
  total: { type: Number, required: true },
  deliveredDate: { type: Date },
});

module.exports = mongoose.model("Order", orderSchema);
