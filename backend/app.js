const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const cors = require('cors'); // Assure-toi d'avoir fait: npm install cors
require('dotenv').config();

// --- 1. CONFIGURATION CORS ---
// Remplace tes anciens headers manuels.
// Permet à Vercel (FRONTEND_URL) de discuter avec Render.
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // En prod, utilise l'URL Vercel. En dev, accepte tout.
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content", "Accept", "Content-Type", "Authorization"],
    credentials: true // Important pour les tokens/cookies
}));

app.use(express.json());

// --- 2. CONNEXION MONGODB ---
console.log("Tentative de connexion avec l'URI :", process.env.MONGO_URI ? "Trouvée (Masquée)" : "Non trouvée (Undefined) !");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie !"))
  .catch((error) => {
    console.log("❌ Connexion à MongoDB échouée !");
    console.error(error);
  });

// --- 3. ROUTES ---
app.use('/api/auth', userRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;