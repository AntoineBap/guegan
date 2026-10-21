const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
} = require("../utils/nodemailer");
const { getGlobalSettings } = require("../utils/settings");
const { priceItems, PricingError } = require("../utils/pricing");
const { computeShippingCost } = require("../utils/shipping");

const BCRYPT_ROUNDS = 12;
// Les comptes existants peuvent avoir des majuscules dans l'email : comparaison insensible à la casse
const EMAIL_COLLATION = { locale: "fr", strength: 2 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const normalizeEmail = (v) => str(v, 160).toLowerCase();

// Mêmes règles que le formulaire d'inscription
const passwordError = (pw) => {
  if (typeof pw !== "string" || pw.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
  if (pw.length > 128) return "Mot de passe trop long.";
  if (!/[A-Z]/.test(pw)) return "Le mot de passe doit contenir une majuscule.";
  if (/\s/.test(pw)) return "Le mot de passe ne doit pas contenir d'espaces.";
  return null;
};

const findByEmail = (email) => User.findOne({ email }).collation(EMAIL_COLLATION);

// --- INSCRIPTION ---
exports.signup = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const fields = {
      firstName: str(req.body.firstName, 80),
      lastName: str(req.body.lastName, 80),
      phone: str(req.body.phone, 20).replace(/[\s.]/g, ""),
      companyName: str(req.body.companyName, 150),
      companyAddress: str(req.body.companyAddress, 300),
      siret: str(req.body.siret, 20),
      tvaNumber: str(req.body.tvaNumber, 20),
    };

    if (!email || Object.values(fields).some((v) => !v) || !password) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires." });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Email invalide." });
    const pwError = passwordError(password);
    if (pwError) return res.status(400).json({ message: pwError });

    if (await findByEmail(email)) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = new User({
      ...fields,
      email,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      cart: Array.isArray(req.body.cart) ? req.body.cart.slice(0, 50) : [],
      role: "client",
      isVerified: false,
      verificationToken,
    });

    await user.save();

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError.message);
    }

    return res
      .status(201)
      .json({ message: "Compte créé. Veuillez vérifier vos emails." });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    if (error.name === "ValidationError") {
      const first = Object.values(error.errors)[0];
      return res.status(400).json({ message: first?.message || "Données invalides." });
    }
    console.error("Erreur Signup:", error);
    return res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
};

// --- VALIDATION EMAIL ---
exports.verifyEmail = async (req, res) => {
  try {
    const token = str(req.params.token, 128);
    if (!/^[a-f0-9]{64}$/.test(token))
      return res.status(404).json({ message: "Lien invalide ou expiré." });

    const user = await User.findOneAndUpdate(
      { verificationToken: token },
      { $set: { isVerified: true }, $unset: { verificationToken: 1 } },
    );
    if (!user)
      return res.status(404).json({ message: "Lien invalide ou expiré." });

    res.status(200).json({ message: "Compte activé avec succès !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- RENVOI EMAIL ---
// Réponse identique que le compte existe ou non : on ne révèle pas quels emails sont inscrits
exports.resendEmail = async (req, res) => {
  const genericResponse = {
    message: "Si un compte non activé existe pour cet email, un nouveau lien vient d'être envoyé.",
  };
  try {
    const user = await findByEmail(normalizeEmail(req.body.email));
    if (!user || user.isVerified) return res.status(200).json(genericResponse);

    user.verificationToken = crypto.randomBytes(32).toString("hex");
    await user.save();
    await sendVerificationEmail(user.email, user.verificationToken);
    res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Erreur resend:", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- LOGIN ---
// Hash factice pour que le temps de réponse soit le même que l'email existe ou non
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = email ? await findByEmail(email) : null;

    const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !valid)
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Votre compte n'est pas activé. Vérifiez vos emails." });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d", algorithm: "HS256" },
    );

    return res.status(200).json({
      userId: user._id,
      token,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      tvaNumber: user.tvaNumber,
      siret: user.siret,
      phone: user.phone,
      cart: user.cart,
      role: user.role,
      lastPasswordChange: user.lastPasswordChange,
    });
  } catch (error) {
    console.error("Erreur login:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- PANIER ---
exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select("cart").lean();
    res.status(200).json(user ? user.cart : []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.saveCart = async (req, res) => {
  try {
    const { cart } = req.body;
    if (!Array.isArray(cart) || cart.length > 50)
      return res.status(400).json({ message: "Panier invalide." });

    await User.updateOne({ _id: req.auth.userId }, { $set: { cart } });
    res.status(200).json({ message: "Panier sauvegardé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- COMMANDES ---
const ADDRESS_FIELDS = ["firstName", "lastName", "company", "address", "city", "zip", "country"];
const cleanAddress = (a) => {
  if (!a || typeof a !== "object") return null;
  const out = {};
  for (const k of ADDRESS_FIELDS) out[k] = str(a[k], 200);
  return out.address && out.city && out.zip ? out : null;
};

// Numéro séquentiel par mois : AAAAMM + 4 chiffres (ex: 2026020001)
const nextOrderNumber = async () => {
  const now = new Date();
  const datePrefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastOrder = await Order.findOne({
    orderNumber: mongoose.trusted({ $regex: `^${datePrefix}` }),
  })
    .sort({ orderNumber: -1 })
    .select("orderNumber")
    .lean();
  const next = lastOrder ? parseInt(lastOrder.orderNumber.slice(-4), 10) + 1 : 1;
  return `${datePrefix}${String(next).padStart(4, "0")}`;
};

exports.createOrder = async (req, res) => {
  try {
    const billingAddress = cleanAddress(req.body.billingAddress);
    const shippingAddress = cleanAddress(req.body.shippingAddress);
    if (!billingAddress || !shippingAddress)
      return res.status(400).json({ message: "Adresse incomplète." });

    // Prix et livraison recalculés côté serveur : le total envoyé par le navigateur est ignoré
    const settings = await getGlobalSettings();
    const { items, totalAmount: itemsTotal } = priceItems(req.body.items, settings);
    const shippingCost = await computeShippingCost(shippingAddress, req.body.shippingCost);
    const totalAmount = itemsTotal + Math.max(0, shippingCost);

    const paymentDeadline = new Date();
    paymentDeadline.setDate(paymentDeadline.getDate() + 7);

    // Deux commandes simultanées peuvent obtenir le même numéro : l'index unique
    // rejette la seconde, on retente alors avec le numéro suivant.
    let savedOrder;
    for (let attempt = 0; attempt < 5 && !savedOrder; attempt++) {
      try {
        savedOrder = await Order.create({
          orderNumber: await nextOrderNumber(),
          userId: req.auth.userId,
          items,
          totalAmount,
          shippingCost,
          billingAddress,
          shippingAddress,
          paymentDeadline,
          status: "pending_payment",
        });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }
    if (!savedOrder) throw new Error("Numéro de commande indisponible");

    // Retire du panier uniquement les articles commandés (les autres restent)
    const user = await User.findById(req.auth.userId);
    if (user) {
      const orderedIds = new Set(items.map((i) => i.id).filter(Boolean).map(String));
      user.cart = orderedIds.size
        ? (user.cart || []).filter((c) => !orderedIds.has(String(c.id)))
        : [];
      await user.save();
      sendOrderConfirmationEmail(savedOrder, user).catch((e) =>
        console.error("Erreur email commande:", e.message),
      );
    }

    return res.status(201).json({
      message: "Commande créée !",
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      totalAmount: savedOrder.totalAmount,
    });
  } catch (error) {
    if (error instanceof PricingError)
      return res.status(400).json({ message: error.message });
    console.error("Erreur createOrder:", error);
    return res.status(500).json({ message: "Erreur lors de la création de la commande." });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.auth.userId }).lean();
    if (!order) return res.status(404).json({ message: "Commande introuvable." });
    res.status(200).json(order);
  } catch (error) {
    if (error.name === "CastError")
      return res.status(404).json({ message: "Commande introuvable." });
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- MISE À JOUR DU PROFIL ---
const PROFILE_FIELDS = { firstName: 80, lastName: 80, phone: 20, siret: 20, companyName: 150, companyAddress: 300, tvaNumber: 20 };

exports.updateProfile = async (req, res) => {
  try {
    const update = {};
    for (const [k, max] of Object.entries(PROFILE_FIELDS)) {
      if (req.body[k] !== undefined) update[k] = str(req.body[k], max);
    }
    if (update.phone) update.phone = update.phone.replace(/[\s.]/g, "");

    if (!update.firstName || !update.lastName) {
      return res.status(400).json({ message: "Le prénom et le nom sont obligatoires." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.auth.userId,
      { $set: update },
      { new: true, runValidators: true },
    ).select(Object.keys(PROFILE_FIELDS).join(" "));

    if (!updatedUser) return res.status(404).json({ message: "Utilisateur introuvable." });

    const out = {};
    for (const k of Object.keys(PROFILE_FIELDS)) out[k] = updatedUser[k];
    return res.status(200).json(out);
  } catch (error) {
    if (error.name === "ValidationError") {
      const first = Object.values(error.errors)[0];
      return res.status(400).json({ message: first?.message || "Données invalides." });
    }
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- CHANGEMENT DE MOT DE PASSE ---
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== "string" || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Les deux mots de passe sont obligatoires." });
    }
    const pwError = passwordError(newPassword);
    if (pwError) return res.status(400).json({ message: pwError });

    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe actuel incorrect." });

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.lastPasswordChange = new Date();
    await user.save();

    return res.status(200).json({ lastPasswordChange: user.lastPasswordChange });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// --- SUPPRESSION DU COMPTE ---
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.auth.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });
    return res.status(200).json({ message: "Compte supprimé." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
