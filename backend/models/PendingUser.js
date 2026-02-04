const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const pendingUserSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  siret: { type: String, required: true },
  tvaNumber: { type: String, required: true },
  validationToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } 
});

pendingUserSchema.plugin(uniqueValidator);

module.exports = mongoose.model('PendingUser', pendingUserSchema);