// const mongoose = require("mongoose");

// const walletSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   balance: { type: Number, default: 0 },
//   transactions: [
//     {
//       type: { type: String, required: true }, // Example: "credit" or "debit"
//       transactionId: { type: String, unique: true }, // UUID
//       amount: { type: Number, required: true },
//       date: { type: Date, default: Date.now },
//       reason: { type: String }, // Example: "Refund for Order #1234"
//       orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
//     },
//   ],
// });

// module.exports = mongoose.model("Wallet", walletSchema);
const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },  // ✅ User Wallet (Optional)
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null }, // ✅ Admin Wallet (Optional)
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, }, // "credit" or "debit"
      transactionId: { type: String, }, // UUID
      amount: { type: Number,},
      date: { type: Date, default: Date.now },
      reason: { type: String }, // Example: "Payment received" or "Refund"
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    },
  ],
});

// ✅ Ensure that either `userId` or `adminId` is present, but not both
walletSchema.pre("save", function (next) {
  if (!this.userId && !this.adminId) {
    return next(new Error("Wallet must have either a userId or an adminId."));
  }
  next();
});

module.exports = mongoose.model("Wallet", walletSchema);
