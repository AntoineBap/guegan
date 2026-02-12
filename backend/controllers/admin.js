const Order = require('../models/Order');
const User = require('../models/User');
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
        // .lean() permet d'obtenir des objets JavaScript simples (plus rapide)
        const users = await User.find({ role: { $ne: 'admin' } })
            .select('-password') 
            .lean(); 

        // 2. Formater les données pour le tableau
        const formattedUsers = users.map(user => {
            
            // Formatage du panier (directement depuis l'objet user)
            let cartContentString = "";
            if (user.cart && user.cart.length > 0) {
                cartContentString = user.cart.map(item => 
                    // Adaptez ici selon la structure exacte de vos items dans le panier
                    `- ${item.quantity}x ${item.material || 'Plan'} ${item.length}x${item.width}mm`
                ).join('\n');
            } else {
                cartContentString = "Panier vide";
            }

            // Retourner l'objet prêt pour le frontend
            return {
                id: user._id, // Utile pour une clé unique coté front, mais pas affiché
                nom_complet: `${user.lastName || ''} ${user.firstName || ''}`.toUpperCase(),
                email: user.email,
                telephone: user.phone || "N/A",
                siret: user.siret || "N/A",
                entreprise: user.companyName || "N/A",
                // Dans votre modèle User.js, c'est 'companyAddress', pas 'billingAddress'
                adresse: user.companyAddress || "N/A", 
                tva: user.tvaNumber || "N/A",
                panier: cartContentString
            };
        });

        res.status(200).json(formattedUsers);
    } catch (error) {
        console.error("Erreur export users:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }
};