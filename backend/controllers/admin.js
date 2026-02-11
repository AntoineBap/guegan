const Order = require('../models/Order');
const User = require('../models/User');
// Assure-toi que ce chemin pointe bien vers ton fichier modifié avec Brevo
const { sendStatusUpdateEmail } = require('../utils/nodemailer');

// --- 1. DASHBOARD STATS ---
exports.getDashboardStats = async (req, res) => {
    try {
        const pending = await Order.countDocuments({ status: 'pending_payment' });
        const paid = await Order.countDocuments({ status: 'paid' });
        const shipped = await Order.countDocuments({ status: 'shipped' });
        const users = await User.countDocuments({ role: 'client' });

        res.status(200).json({ pending, paid, shipped, users });
    } catch (error) {
        console.error("Erreur Stats:", error);
        res.status(500).json({ error });
    }
};

// --- 2. RÉCUPÉRER LES COMMANDES PAR STATUT ---
exports.getOrdersByStatus = async (req, res) => {
    try {
        // DEBUG : On affiche ce que le controller reçoit
        console.log("🔍 Requête reçue pour le statut (params):", req.params);
        
        const { status } = req.params;

        if (!status) {
            return res.status(400).json({ message: "Paramètre 'status' manquant dans l'URL" });
        }

        // On récupère les commandes + les infos de l'utilisateur associé
        // Note: Assure-toi que 'userId' est bien le nom du champ dans ton modèle Order
        const orders = await Order.find({ status: status })
            .populate('userId', 'email phone companyName firstName lastName') 
            .sort({ createdAt: -1 });

        console.log(`📦 ${orders.length} commandes trouvées pour le statut '${status}'`);

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

        console.log(`🔄 Mise à jour commande ${id} vers ${status}`);

        // 1. Mise à jour de la commande
        const order = await Order.findByIdAndUpdate(
            id, 
            { status: status }, 
            { new: true } // Renvoie la version mise à jour
        );
        
        if (!order) {
            return res.status(404).json({ message: "Commande introuvable" });
        }

        // 2. Récupération du client pour l'email
        // On vérifie que userId existe avant de chercher
        if (order.userId) {
            const user = await User.findById(order.userId);
            
            // 3. Envoi de l'email via Brevo (si user trouvé)
            if (user) {
                try {
                    await sendStatusUpdateEmail(order, user, status);
                    console.log("📧 Email de statut envoyé avec succès.");
                } catch (emailError) {
                    console.error("⚠️ Erreur envoi email (mais statut mis à jour):", emailError.message);
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
        const order = await Order.findById(req.params.id)
            .populate('userId', '-password'); // On exclut le mot de passe
        
        if (!order) {
            return res.status(404).json({ message: "Commande introuvable" });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};