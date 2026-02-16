const Order = require("../models/Order");
const User = require("../models/User");
const { sendStatusUpdateEmail } = require("../utils/nodemailer");
const Settings = require("../models/Settings");

// --- 1. DASHBOARD STATS ---
exports.getDashboardStats = async (req, res) => {
  try {
    const pending = await Order.countDocuments({ status: "pending_payment" });
    const paid = await Order.countDocuments({ status: "paid" });
    const shipped = await Order.countDocuments({ status: "shipped" });
    const users = await User.countDocuments({ role: "client" });

    res.status(200).json({ pending, paid, shipped, users });
  } catch (error) {
    console.error("Erreur Stats:", error);
    res.status(500).json({ error });
  }
};

// --- 2. RÉCUPÉRER LES COMMANDES PAR STATUT ---
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!status) {
      return res
        .status(400)
        .json({ message: "Paramètre 'status' manquant dans l'URL" });
    }

    // On récupère les commandes + les infos de l'utilisateur associé
    const orders = await Order.find({ status: status })
      .populate("userId", "email phone companyName firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Erreur getOrdersByStatus:", error);
    res.status(500).json({ error });
  }
};

// --- 3. METTRE À JOUR LE STATUT (+ EMAIL) ---
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Mise à jour de la commande
    const order = await Order.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }, // Renvoie la version mise à jour
    );

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    // 2. Récupération du client pour l'email
    if (order.userId) {
      const user = await User.findById(order.userId);

      // 3. Envoi de l'email via Brevo (si user trouvé)
      if (user) {
        try {
          await sendStatusUpdateEmail(order, user, status);
        } catch (emailError) {
          console.error(
            "⚠️ Erreur envoi email (mais statut mis à jour):",
            emailError.message,
          );
        }
      }
    }

    res.status(200).json({ message: `Statut mis à jour : ${status}` });
  } catch (error) {
    console.error("❌ Erreur updateOrderStatus:", error);
    res.status(500).json({ error });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    // On récupère la commande par son ID et on peuple les infos user
    const order = await Order.findById(req.params.id).populate(
      "userId",
      "-password",
    ); // On exclut le mot de passe

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    res.status(200).json({ message: "Commande supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllUsersWithCarts = async (req, res) => {
  try {
    // 1. Récupérer tous les utilisateurs (sauf les admins)
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .lean();

    // 2. Formater les données pour le tableau
    const formattedUsers = users.map((user) => {
      // Formatage du panier (texte)
      let cartContentString = "";
      let totalCartPrice = 0; // Variable pour le total

      if (user.cart && user.cart.length > 0) {
        // Construction du texte du panier
        cartContentString = user.cart
          .map(
            (item) =>
              `- ${item.quantity}x ${item.material || "Plan"} ${item.length}x${item.width}mm`,
          )
          .join("\n");

        // Calcul du prix total du panier DYNAMIQUE (Prix Unitaire * Quantité)
        // Cela corrige le problème si la quantité change mais que le champ totalPrice n'a pas été mis à jour en base
        totalCartPrice = user.cart.reduce((acc, item) => {
          const unitPrice = item.unitPrice || 0;
          const quantity = item.quantity || 1;
          return acc + unitPrice * quantity;
        }, 0);
      } else {
        cartContentString = "Panier vide";
        totalCartPrice = 0;
      }

      // Retourner l'objet prêt pour le frontend
      return {
        id: user._id,
        nom_complet:
          `${user.lastName || ""} ${user.firstName || ""}`.toUpperCase(),
        email: user.email,
        telephone: user.phone || "N/A",
        siret: user.siret || "N/A",
        entreprise: user.companyName || "N/A",
        adresse: user.companyAddress || "N/A",
        tva: user.tvaNumber || "N/A",
        panier: cartContentString,
        total_panier: totalCartPrice, // Total recalculé
      };
    });

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Erreur export users:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des données" });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: req.params.key });
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true },
    );
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error });
  }
};
