const Quote = require("../models/Quote");

// Générateur de numéro : D + 4 chiffres + Mois + Année (ex: D00010226)
const generateQuoteNumber = async () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  
  const count = await Quote.countDocuments();
  const nextNumber = String(count + 1).padStart(4, "0");
  
  return `D${nextNumber}${month}${year}`;
};

// --- CÔTÉ CLIENT ---

exports.createQuote = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const quoteNumber = await generateQuoteNumber();

    // 2. On essaie de récupérer l'ID de toutes les manières possibles selon les standards habituels
    // (Vérifie bien comment ton middleware auth.js attache l'ID)
    const userId = 
      (req.user && req.user.userId) || 
      (req.user && req.user._id) || 
      (req.user && req.user.id) || 
      (req.auth && req.auth.userId) || 
      req.userId;

    if (!userId) {
      return res.status(400).json({ error: "Impossible de récupérer l'ID de l'utilisateur depuis le token." });
    }

    const newQuote = new Quote({
      userId: userId, // On utilise l'ID sécurisé
      quoteNumber,
      items,
      totalAmount,
    });

    await newQuote.save();
    res.status(201).json(newQuote);
  } catch (error) {
    // 3. On affiche la vraie erreur dans ton terminal backend
    console.error("❌ Erreur lors de la création du devis :", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMyQuotes = async (req, res) => {
  try {
    // Récupération blindée de l'ID utilisateur
    const userId = 
      (req.user && req.user.userId) || 
      (req.user && req.user._id) || 
      (req.auth && req.auth.userId) || 
      req.userId || 
      req.user;

    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur introuvable" });
    }

    const quotes = await Quote.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json(quotes);

  } catch (error) {
    console.error("❌ Erreur dans getMyQuotes :", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!quote) return res.status(404).json({ message: "Devis introuvable" });
    res.status(200).json({ message: "Devis supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- CÔTÉ ADMIN ---

exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().populate("userId", "-password").sort({ createdAt: -1 });
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