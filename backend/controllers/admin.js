const mongoose = require("mongoose");
const Order = require("../models/Order");
const { ORDER_STATUSES } = require("../models/Order");
const User = require("../models/User");
const Quote = require("../models/Quote");
const Settings = require("../models/Settings");
const { sendStatusUpdateEmail, cancelStatusEmail } = require("../utils/nodemailer");
const { invalidateCache, getSettingsDoc } = require("../utils/settings");

const USER_FIELDS = "email firstName lastName phone companyName companyAddress siret tvaNumber";

const notFound = (res) => res.status(404).json({ message: "Commande introuvable." });
const serverError = (res, error) => {
  console.error(error);
  res.status(500).json({ message: "Erreur serveur." });
};

// --- 1. DASHBOARD STATS ---
exports.getDashboardStats = async (req, res) => {
  try {
    const [byStatus, users, quotes] = await Promise.all([
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } }]),
      User.countDocuments({ role: "client" }),
      Quote.estimatedDocumentCount(),
    ]);

    const stat = (s) => byStatus.find((b) => b._id === s) || { count: 0, amount: 0 };
    res.status(200).json({
      pending: stat("pending_payment").count,
      paid: stat("paid").count,
      shipped: stat("shipped").count,
      users,
      quotes,
      amounts: {
        pending: stat("pending_payment").amount,
        paid: stat("paid").amount,
        shipped: stat("shipped").amount,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
};

// --- 2. RÉCUPÉRER LES COMMANDES PAR STATUT ---
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Statut inconnu." });
    }

    const orders = await Order.find({ status })
      .populate("userId", "email phone companyName firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(orders);
  } catch (error) {
    serverError(res, error);
  }
};

// --- 3. METTRE À JOUR LE STATUT (+ EMAIL) ---
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Statut inconnu." });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return notFound(res);

    // Email envoyé avec 1h de délai (annulable via rollback)
    const user = order.userId ? await User.findById(order.userId).select("email firstName lastName").lean() : null;
    if (user) {
      try {
        sendStatusUpdateEmail(order, user, status);
      } catch (emailError) {
        console.error("Erreur planification email:", emailError.message);
      }
    }

    res.status(200).json({ message: `Statut mis à jour : ${status}` });
  } catch (error) {
    if (error.name === "CastError") return notFound(res);
    serverError(res, error);
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId", USER_FIELDS).lean();
    if (!order) return notFound(res);
    res.status(200).json(order);
  } catch (error) {
    if (error.name === "CastError") return notFound(res);
    serverError(res, error);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return notFound(res);
    cancelStatusEmail(req.params.id);
    res.status(200).json({ message: "Commande supprimée avec succès" });
  } catch (error) {
    if (error.name === "CastError") return notFound(res);
    serverError(res, error);
  }
};

exports.getAllUsersWithCarts = async (req, res) => {
  try {
    const users = await User.find({ role: mongoose.trusted({ $ne: "admin" }) })
      .select("firstName lastName email phone siret companyName companyAddress tvaNumber cart")
      .lean();

    const formattedUsers = users.map((user) => {
      const cart = Array.isArray(user.cart) ? user.cart : [];

      // Total recalculé (prix unitaire × quantité) : le champ totalPrice peut être périmé
      const totalCartPrice = cart.reduce(
        (acc, item) => acc + (item.unitPrice || 0) * (item.quantity || 1),
        0,
      );

      return {
        id: user._id,
        nom_complet: `${user.lastName || ""} ${user.firstName || ""}`.toUpperCase(),
        email: user.email,
        telephone: user.phone || "N/A",
        siret: user.siret || "N/A",
        entreprise: user.companyName || "N/A",
        adresse: user.companyAddress || "N/A",
        tva: user.tvaNumber || "N/A",
        panier: cart.length
          ? cart
              .map((item) => `- ${item.quantity}x ${item.material || "Plan"} ${item.length}x${item.width}mm`)
              .join("\n")
          : "Panier vide",
        total_panier: totalCartPrice,
      };
    });

    res.status(200).json(formattedUsers);
  } catch (error) {
    serverError(res, error);
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getSettingsDoc(String(req.params.key));
    res.status(200).json(settings);
  } catch (error) {
    serverError(res, error);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (typeof key !== "string" || !key || !value || typeof value !== "object") {
      return res.status(400).json({ message: "Paramètres invalides." });
    }

    const settings = await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true },
    );
    invalidateCache();
    res.status(200).json(settings);
  } catch (error) {
    serverError(res, error);
  }
};

// --- ROLLBACK STATUT COMMANDE (annule aussi le mail planifié) ---
exports.rollbackOrderStatus = async (req, res) => {
  try {
    const prev = { paid: "pending_payment", shipped: "paid" };

    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res);
    if (!prev[order.status])
      return res.status(400).json({ message: "Rollback impossible depuis ce statut." });

    cancelStatusEmail(req.params.id);

    order.status = prev[order.status];
    await order.save();

    const updatedOrder = await Order.findById(req.params.id).populate("userId", USER_FIELDS).lean();
    res.status(200).json({ order: updatedOrder });
  } catch (error) {
    if (error.name === "CastError") return notFound(res);
    serverError(res, error);
  }
};
