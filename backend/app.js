require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const configRoutes = require("./routes/config");
const publicRoutes = require("./routes/public");

const app = express();

// Derrière nginx / pm2 : nécessaire pour que le rate-limit voie la vraie IP
app.set("trust proxy", 1);
app.disable("x-powered-by");

// --- SÉCURITÉ ---
app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, cb) => {
      // Requêtes sans origine (curl, cron, healthcheck) ou origine autorisée
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// Bloque les opérateurs Mongo ($ne, $gt…) injectés dans les filtres
mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGO_URI).catch((error) => {
  console.error("Connexion MongoDB impossible :", error.message);
});

// --- ROUTES ---
app.use("/api/auth", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/config", configRoutes);
app.use("/api", publicRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

// --- ERREURS ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large")
    return res.status(413).json({ message: "Requête trop volumineuse." });
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ message: "JSON invalide." });
  if (err.name === "MulterError")
    return res.status(400).json({ message: "Fichier refusé (5 Mo max)." });
  if (err.status === 400) return res.status(400).json({ message: err.message });

  console.error(err);
  res.status(500).json({ message: "Erreur serveur." });
});

module.exports = app;
