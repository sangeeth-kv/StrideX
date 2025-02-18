const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  offer: { type: Number, default: 0 },
  description: { type: String, required: true },
});

module.exports = mongoose.model("Category", categorySchema);
