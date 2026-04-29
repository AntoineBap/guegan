const Quote = require("../models/Quote");

// Générateur de numéro : D + 4 chiffres + Mois + Année (ex: D00010226)
const generateQuoteNumber = async () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

  const lastQuote = await Quote.findOne(
    { quoteNumber: { $regex: `${month}${year}$` } },
    { quoteNumber: 1 },
    { sort: { quoteNumber: -1 } }
  );

  let nextNumber = 1;
  if (lastQuote) {
    const lastNum = parseInt(lastQuote.quoteNumber.slice(1, 5), 10);
    nextNumber = lastNum + 1;
  }

  return `D${String(nextNumber).padStart(4, "0")}${month}${year}`;
};

// --- CÔTÉ CLIENT ---

exports.createQuote = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur introuvable" });
    }

    const quoteNumber = await generateQuoteNumber();
    const newQuote = new Quote({ userId, quoteNumber, items, totalAmount });
    await newQuote.save();
    res.status(201).json(newQuote);
  } catch (error) {
    console.error("❌ Erreur lors de la création du devis :", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMyQuotes = async (req, res) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur introuvable" });
    }

    const quotes = await Quote.find({ userId })
      .populate("userId", "-password")
      .sort({ createdAt: -1 });
    res.status(200).json(quotes);
  } catch (error) {
    console.error("❌ Erreur dans getMyQuotes :", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const quote = await Quote.findOneAndDelete({ _id: req.params.id, userId });
    if (!quote) return res.status(404).json({ message: "Devis introuvable" });
    res.status(200).json({ message: "Devis supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- CÔTÉ ADMIN ---

exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find()
      .populate("userId", "-password")
      .sort({ createdAt: -1 });
    res.status(200).json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate("userId", "-password");
    if (!quote) return res.status(404).json({ message: "Devis introuvable" });
    res.status(200).json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};