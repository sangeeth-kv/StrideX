const mongoose = require("mongoose");

// Brand Schema
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  // logo: { type: String }, // Optional: Store logo URL
  description: { type: String },
});

module.exports = mongoose.model("Brand", brandSchema);

