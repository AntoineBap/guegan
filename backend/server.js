// 1. Charger les variables d'environnement EN PREMIER
require("dotenv").config();

const http = require("http");
const app = require("./app");
const cron = require("node-cron");
const Quote = require("./models/Quote");
const { sendDailyQuotesSummary } = require("./utils/nodemailer");

const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const errorHandler = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);

server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
});

const cronTime = process.env.DAILY_QUOTE_EMAIL_TIME || "18:00";
const [hour, minute] = cronTime.split(':');

cron.schedule(`${minute} ${hour} * * *`, async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newQuotesCount = await Quote.countDocuments({
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (newQuotesCount > 0) {
      await sendDailyQuotesSummary(newQuotesCount);
    }
  } catch (error) {
    console.error(error);
  }
});

server.listen(port);