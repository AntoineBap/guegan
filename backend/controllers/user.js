const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Order = require("../models/Order");
const {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
} = require("../utils/nodemailer");
require("dotenv").config();

// --- INSCRIPTION ---
exports.signup = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      companyName,
      companyAddress,
      siret,
      tvaNumber,
      cart,
    } = req.body;

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phone ||
      !companyName ||
      !companyAddress ||
      !siret ||
      !tvaNumber
    ) {
      return res
        .status(400)
        .json({ message: "Tous les champs sont obligatoires." });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      email,
      password: hash,
      firstName,
      lastName,
      phone,
      companyName,
      companyAddress,
      siret,
      tvaNumber,
      cart: cart || [],
      role: "client",
      isVerified: false,
      verificationToken: verificationToken,
    });

    await user.save();

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
    }

    return res
      .status(201)
      .json({ message: "Compte créé. Veuillez vérifier vos emails." });
  } catch (error) {
    console.error("Erreur Signup:", error);
    return res
      .status(500)
      .json({
        message: "Erreur serveur lors de l'inscription",
        error: error.message,
      });
  }
};

// --- VALIDATION EMAIL ---
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user)
      return res.status(404).json({ message: "Lien invalide ou expiré." });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Compte activé avec succès !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- RENVOI EMAIL ---
exports.resendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });
    if (user.isVerified)
      return res.status(400).json({ message: "Compte déjà vérifié" });

    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    await user.save();

    await sendVerificationEmail(user.email, newToken);
    res.status(200).json({ message: "Email renvoyé !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- LOGIN ---
exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ error: "Utilisateur non trouvé" });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Mot de passe incorrect" });

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: "Votre compte n'est pas activé. Vérifiez vos emails." });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    return res.status(200).json({
      userId: user._id,
      token,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      tvaNumber: user.tvaNumber,
      siret: user.siret,
      phone: user.phone,
      cart: user.cart,
      role: user.role,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

// --- AUTRES FONCTIONS (Panier, Commandes) ---
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    res.status(200).json(user ? user.cart : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveCart = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.auth.userId },
      { $set: { cart: req.body.cart } },
    );
    res.status(200).json({ message: "Panier sauvegardé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, billingAddress, shippingAddress } = req.body;

    // --- GÉNÉRATION DU NUMÉRO DE COMMANDE SÉQUENTIEL ---
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const datePrefix = `${year}${month}`; // ex: "202602"

    // Cherche la dernière commande du mois en cours
    const lastOrder = await Order.findOne({
      orderNumber: new RegExp("^" + datePrefix),
    }).sort({ orderNumber: -1 });

    let nextNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      nextNumber = lastSequence + 1;
    }

    const sequence = String(nextNumber).padStart(4, "0");
    const finalOrderNumber = `${datePrefix}${sequence}`;
    // --------------------------------------------------

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const newOrder = new Order({
      orderNumber: finalOrderNumber,
      userId: req.auth.userId,
      items,
      totalAmount,
      billingAddress,
      shippingAddress,
      paymentDeadline: deadline,
      status: "pending_payment",
    });

    const savedOrder = await newOrder.save();
    const user = await User.findById(req.auth.userId);
    if (user) sendOrderConfirmationEmail(savedOrder, user).catch(console.error);

    await User.updateOne({ _id: req.auth.userId }, { $set: { cart: [] } });
    return res.status(201).json({
      message: "Commande créée !",
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Introuvable" });
    if (order.userId.toString() !== req.auth.userId)
      return res.status(403).json({ error: "Non autorisé" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.auth.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
