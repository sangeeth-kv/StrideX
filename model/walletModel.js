const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, required: true },
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    },
  ],
});

module.exports = mongoose.model("Wallet", walletSchema);
