const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  siret: { type: String, required: true },
  tvaNumber: { type: String, required: true },
  
  // On stocke le panier sous forme de tableau d'objets libre
  cart: { type: Array, default: [] } 
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);