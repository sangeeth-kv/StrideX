const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, required: true }, // Example: "credit" or "debit"
      transactionId: { type: String, unique: true }, // UUID
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      reason: { type: String }, // Example: "Refund for Order #1234"
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    },
  ],
});

module.exports = mongoose.model("Wallet", walletSchema);
