const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require('./routes/user');
require('dotenv').config();

app.use(express.json());

// --- MODIFICATION ICI ---
// 1. On vérifie si l'URI est bien détectée (sans afficher le mot de passe en clair)
console.log("Tentative de connexion avec l'URI :", process.env.MONGO_URI ? "Trouvée (Masquée)" : "Non trouvée (Undefined) !");

// 2. Connexion simplifiée (Mongoose 9 gère les options par défaut maintenant)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie !"))
  .catch((error) => {
    console.log("❌ Connexion à MongoDB échouée !");
    console.error(error); // Affiche l'erreur technique précise dans le terminal
  });
// ------------------------

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use('/api/auth', userRoutes);

module.exports = app;