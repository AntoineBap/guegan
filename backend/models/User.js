const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  // L'index unique protège contre les doublons ; le contrôleur renvoie un message clair
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },

  phone: {
    type: String,
    required: true,
    match: [
      /^\d+$/,
      "Le numéro de téléphone ne doit contenir que des chiffres.",
    ],
  },

  companyName: { type: String, required: true, trim: true, maxlength: 150 },
  companyAddress: { type: String, required: true, trim: true, maxlength: 300 },

  siret: { type: String, required: true, trim: true, maxlength: 20 }, // Pas de unique: true
  tvaNumber: { type: String, required: true, trim: true, maxlength: 20 },

  role: { type: String, default: "client", enum: ["client", "admin"] },
  cart: { type: Array, default: [] },

  // Champs techniques pour la validation par email
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, index: true, sparse: true },
  lastPasswordChange: { type: Date },
});

module.exports = mongoose.model("User", userSchema);
