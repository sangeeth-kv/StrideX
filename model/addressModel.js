const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  district: { type: String, required: true },
  mobile_number: { type: String, required: true },
  place: { type: String, required: true },
  city: { type: String, required: true },
  type: { type: String, required: true },
});

module.exports = mongoose.model("Address", addressSchema);
