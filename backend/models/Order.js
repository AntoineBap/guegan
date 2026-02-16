const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },

  // On accepte des objets flexibles pour les adresses
  billingAddress: { type: Object, required: true },
  shippingAddress: { type: Object, required: true },

  // Statut
  status: { type: String, default: "pending_payment" }, // pending_payment, paid, shipped

  createdAt: { type: Date, default: Date.now },
  paymentDeadline: { type: Date },
});

module.exports = mongoose.model("Order", orderSchema);
