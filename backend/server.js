require("dotenv").config();

// Sans secret JWT, n'importe qui pourrait forger un token : on refuse de démarrer
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET manquant dans .env");
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn("⚠ JWT_SECRET trop court (32 caractères minimum recommandés).");
}

const http = require("http");
const mongoose = require("mongoose");
const cron = require("node-cron");
const app = require("./app");
const Quote = require("./models/Quote");
const { sendDailyQuotesSummary } = require("./utils/nodemailer");

const port = parseInt(process.env.PORT || "3000", 10);
app.set("port", port);

const server = http.createServer(app);

server.on("error", (error) => {
  if (error.syscall !== "listen") throw error;
  if (error.code === "EACCES") console.error(`Le port ${port} nécessite des privilèges élevés.`);
  else if (error.code === "EADDRINUSE") console.error(`Le port ${port} est déjà utilisé.`);
  else throw error;
  process.exit(1);
});

server.on("listening", () => console.log(`API démarrée sur le port ${port}`));

// --- RÉCAPITULATIF QUOTIDIEN DES DEVIS ---
const [hour, minute] = (process.env.DAILY_QUOTE_EMAIL_TIME || "18:00").split(":");

cron.schedule(
  `${Number(minute)} ${Number(hour)} * * *`,
  async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await Quote.countDocuments({ createdAt: mongoose.trusted({ $gte: since }) });
      if (count > 0) await sendDailyQuotesSummary(count);
    } catch (error) {
      console.error("Erreur récapitulatif devis:", error.message);
    }
  },
  { timezone: "Europe/Paris" },
);

server.listen(port);

// Arrêt propre (pm2 restart / reload)
const shutdown = () => {
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 10000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
