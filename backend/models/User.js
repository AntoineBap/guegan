const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Seul l'email doit être unique
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  
  phone: {
    type: String,
    required: true,
    match: [/^\d+$/, "Le numéro de téléphone ne doit contenir que des chiffres."]
  },

  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  
  siret: { type: String, required: true }, // Pas de unique: true
  tvaNumber: { type: String, required: true },
  
  role: { type: String, default: "client", enum: ["client", "admin"] },
  cart: { type: Array, default: [] },

  // Champs techniques pour la validation par email
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);