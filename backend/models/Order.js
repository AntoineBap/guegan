const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  billingAddress: { type: Object, required: true },
  shippingAddress: { type: Object, required: true },
  status: { type: String, default: 'pending_payment' }, // pending_payment, paid, shipped
  createdAt: { type: Date, default: Date.now },
  paymentDeadline: { type: Date } // Date limite de paiement
});

module.exports = mongoose.model('Order', orderSchema);