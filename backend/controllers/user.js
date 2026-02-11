const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const Order = require('../models/Order'); 
const { sendVerificationEmail, sendOrderConfirmationEmail } = require('../utils/nodemailer'); 
const PasswordValidator = require('password-validator');
require('dotenv').config();

// --- CONFIGURATION VALIDATION MOT DE PASSE ---
const passwordSchema = new PasswordValidator();
passwordSchema.is().min(8).is().max(100).has().uppercase().has().not().spaces();

// --- INSCRIPTION ---
exports.signup = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, companyName, companyAddress, siret, tvaNumber, cart } = req.body;
        
        if (!email || !password || !firstName || !lastName || !companyName || !companyAddress || !siret || !tvaNumber) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires." });
        }
        if (!passwordSchema.validate(password)) {
            return res.status(400).json({ message: "Mot de passe invalide (8 char min, 1 majuscule, sans espace)." });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { siret }] });
        if (existingUser) return res.status(400).json({ message: "Compte déjà existant." });

        const hash = await bcrypt.hash(password, 10);
        const validationToken = crypto.randomBytes(32).toString('hex');
        
        const pendingUser = new PendingUser({
            email, password: hash, firstName, lastName, companyName, 
            companyAddress, siret, tvaNumber, validationToken, cart: cart || [] 
        });

        await pendingUser.save();
        
        try {
            await sendVerificationEmail(email, validationToken);
        } catch (emailError) {
            console.error("Erreur envoi email inscription:", emailError);
            // On ne bloque pas l'inscription mais on log l'erreur
        }
        
        return res.status(201).json({ message: 'Inscription réussie. Vérifiez vos emails.' });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// --- LOGIN ---
exports.login = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(401).json({ error: 'Utilisateur non trouvé' });
        
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET', { expiresIn: '24h' });

        return res.status(200).json({ 
            userId: user._id, 
            token, 
            firstName: user.firstName, 
            lastName: user.lastName,
            companyName: user.companyName,
            companyAddress: user.companyAddress,
            zip: user.zip,
            city: user.city,
            cart: user.cart,
            role: user.role 
        });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// --- PANIER ---
exports.getCart = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.auth.userId });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        return res.status(200).json(user.cart);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.saveCart = async (req, res, next) => {
    try {
        const { cart } = req.body;
        await User.updateOne({ _id: req.auth.userId }, { $set: { cart: cart } });
        return res.status(200).json({ message: "Panier sauvegardé !" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// --- COMMANDES ---

// 1. Créer une commande (FIXÉ)
exports.createOrder = async (req, res, next) => {
    try {
        const { items, totalAmount, billingAddress, shippingAddress } = req.body;
        
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7); // J+7 pour paiement

        const newOrder = new Order({
            userId: req.auth.userId,
            items,
            totalAmount,
            billingAddress,
            shippingAddress,
            paymentDeadline: deadline,
            status: 'pending_payment'
        });

        const savedOrder = await newOrder.save();

        // Récupérer l'utilisateur pour l'envoi de mail
        const user = await User.findById(req.auth.userId);
        
        // Envoi email confirmation (Isolé pour ne pas faire planter la réponse HTTP)
        if (user) {
            try {
                await sendOrderConfirmationEmail(savedOrder, user);
            } catch (emailError) {
                console.error("❌ AVERTISSEMENT : L'email de confirmation n'a pas pu être envoyé.", emailError.message);
                // On continue, car la commande est bien enregistrée en BDD
            }
        }

        // On vide le panier de l'utilisateur après commande
        await User.updateOne({ _id: req.auth.userId }, { $set: { cart: [] } });

        return res.status(201).json({ 
            message: "Commande créée !", 
            orderId: savedOrder._id 
        });
    } catch (error) {
        console.error("❌ ERREUR CRITIQUE COMMANDE :", error);
        return res.status(500).json({ message: error.message, error: error.toString() });
    }
};

// 2. Récupérer une commande spécifique
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id });
        if (!order) return res.status(404).json({ error: "Commande introuvable" });
        
        if (order.userId.toString() !== req.auth.userId) {
            return res.status(403).json({ error: "Non autorisé" });
        }

        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 3. Récupérer toutes les commandes du client
exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ userId: req.auth.userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// (Placeholders pour éviter les erreurs d'import si utilisés ailleurs)
exports.verifyEmail = async (req, res) => { res.status(200).json({message: "Not implemented in this snippet"}); };
exports.resendEmail = async (req, res) => { res.status(200).json({message: "Not implemented in this snippet"}); };