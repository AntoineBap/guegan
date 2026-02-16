const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const configRoutes = require('./routes/config');
// 1. IMPORT DU NOUVEAU FICHIER DE ROUTES (où se trouve Multer et le contact)
const publicRoutes = require('./routes/public'); 

const cors = require('cors'); 
require('dotenv').config();

// --- CONFIGURATION CORS ---
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content", "Accept", "Content-Type", "Authorization"],
    credentials: true 
}));

// Parse le JSON (pour les requêtes classiques)
app.use(express.json());

// Parse les données URL-encoded (utile parfois, mais Multer gère le multipart indépendamment)
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .catch((error) => {
    console.error(error);
  });

// --- ROUTES ---
app.use('/api/auth', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.use('/api', publicRoutes); 

module.exports = app;