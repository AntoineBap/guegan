const mongoose = require("mongoose");

const quoteSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quoteNumber: { type: String, required: true, unique: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

quoteSchema.index({ userId: 1, createdAt: -1 });
quoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Quote", quoteSchema);
