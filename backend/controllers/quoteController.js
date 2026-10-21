const mongoose = require("mongoose");
const Quote = require("../models/Quote");
const { getGlobalSettings } = require("../utils/settings");
const { priceItems, PricingError } = require("../utils/pricing");

// Champs utilisateur exposés avec un devis (jamais le mot de passe ni le token de vérification)
const USER_FIELDS = "email firstName lastName phone companyName companyAddress siret tvaNumber";

// Générateur de numéro : D + 4 chiffres + Mois + Année (ex: D00010226)
const generateQuoteNumber = async () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

  const lastQuote = await Quote.findOne(
    { quoteNumber: mongoose.trusted({ $regex: `${month}${year}$` }) },
    { quoteNumber: 1 },
    { sort: { quoteNumber: -1 } },
  ).lean();

  const nextNumber = lastQuote ? parseInt(lastQuote.quoteNumber.slice(1, 5), 10) + 1 : 1;
  return `D${String(nextNumber).padStart(4, "0")}${month}${year}`;
};

const notFound = (res) => res.status(404).json({ message: "Devis introuvable." });
const serverError = (res, error) => {
  console.error(error);
  res.status(500).json({ message: "Erreur serveur." });
};

// --- CÔTÉ CLIENT ---

exports.createQuote = async (req, res) => {
  try {
    // Prix recalculés côté serveur
    const settings = await getGlobalSettings();
    const { items, totalAmount } = priceItems(req.body.items, settings);

    let quote;
    for (let attempt = 0; attempt < 5 && !quote; attempt++) {
      try {
        quote = await Quote.create({
          userId: req.auth.userId,
          quoteNumber: await generateQuoteNumber(),
          items,
          totalAmount,
        });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }
    if (!quote) throw new Error("Numéro de devis indisponible");

    res.status(201).json(quote);
  } catch (error) {
    if (error instanceof PricingError)
      return res.status(400).json({ message: error.message });
    serverError(res, error);
  }
};

exports.getMyQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find({ userId: req.auth.userId })
      .populate("userId", USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(quotes);
  } catch (error) {
    serverError(res, error);
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
    if (!quote) return notFound(res);
    res.status(200).json({ message: "Devis supprimé" });
  } catch (error) {
    if (error.name === "CastError") return notFound(res);
    serverError(res, error);
  }
};

// --- CÔTÉ ADMIN ---

exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find()
      .populate("userId", USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(quotes);
  } catch (error) {
    serverError(res, error);
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate("userId", USER_FIELDS).lean();
    if (!quote) return notFound(res);
    res.status(200).json(quote);
  } catch (error) {
    if (error.name === "CastError") return notFound(res);
    serverError(res, error);
  }
};
