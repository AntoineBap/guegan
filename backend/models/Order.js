const mongoose = require("mongoose");

const ORDER_STATUSES = ["pending_payment", "paid", "shipped"];

const orderSchema = mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: Array, required: true },
  // Total HT, livraison comprise
  totalAmount: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },

  // On accepte des objets flexibles pour les adresses
  billingAddress: { type: Object, required: true },
  shippingAddress: { type: Object, required: true },

  status: { type: String, default: "pending_payment", enum: ORDER_STATUSES },

  createdAt: { type: Date, default: Date.now },
  paymentDeadline: { type: Date },
});

// Listes admin (par statut, plus récentes d'abord) et "Mes commandes"
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
