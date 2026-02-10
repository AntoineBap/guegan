const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const { sendVerificationEmail } = require('../utils/nodemailer'); 
const PasswordValidator = require('password-validator');
require('dotenv').config();

// --- CONFIGURATION VALIDATION MOT DE PASSE ---
const passwordSchema = new PasswordValidator();
passwordSchema
    .is().min(8)
    .is().max(100)
    .has().uppercase()
    .has().not().spaces();

// --- INSCRIPTION ---
exports.signup = async (req, res, next) => {
    try {
        // 1. On récupère le panier (cart) envoyé depuis le front
        const { email, password, firstName, lastName, companyName, companyAddress, siret, tvaNumber, cart } = req.body;
        
        if (!email || !password || !firstName || !lastName || !companyName || !companyAddress || !siret || !tvaNumber) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "Email invalide." });

        if (!passwordSchema.validate(password)) {
            return res.status(400).json({ message: "Le mot de passe doit faire 8 caractères min, avec une majuscule et sans espaces." });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { siret }] });
        if (existingUser) return res.status(400).json({ message: "Compte déjà existant." });

        const existingPending = await PendingUser.findOne({ email });
        if (existingPending) return res.status(400).json({ message: "Inscription déjà en attente. Vérifiez vos emails." });
        
        const hash = await bcrypt.hash(password, 10);
        const validationToken = crypto.randomBytes(32).toString('hex');
        
        const pendingUser = new PendingUser({
            email, 
            password: hash, 
            firstName, 
            lastName, 
            companyName, 
            companyAddress, 
            siret, 
            tvaNumber, 
            validationToken,
            // 2. On stocke le panier temporairement
            cart: cart || [] 
        });

        await pendingUser.save();

        try {
            await sendVerificationEmail(email, validationToken);
        } catch (emailError) {
            await PendingUser.deleteOne({ _id: pendingUser._id });
            console.error("Erreur email:", emailError);
            return res.status(500).json({ message: "Erreur envoi email." });
        }
        
        return res.status(201).json({ message: 'Inscription réussie. Vérifiez vos emails.' });

    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error });
    }
};

// --- RENVOYER L'EMAIL ---
exports.resendEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await PendingUser.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Délai dépassé ou compte inexistant." });
        }

        user.validationToken = crypto.randomBytes(32).toString('hex');
        user.createdAt = Date.now(); 
        await user.save();

        await sendVerificationEmail(user.email, user.validationToken);

        return res.status(200).json({ message: "Email renvoyé !" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error });
    }
};

// --- VALIDATION EMAIL ---
exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const pendingUser = await PendingUser.findOne({ validationToken: token });

        if (!pendingUser) {
            return res.status(400).json({ message: "Lien invalide ou expiré." });
        }

        const newUser = new User({
            email: pendingUser.email,
            password: pendingUser.password,
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            companyName: pendingUser.companyName,
            companyAddress: pendingUser.companyAddress,
            siret: pendingUser.siret,
            tvaNumber: pendingUser.tvaNumber,
            // 3. TRANSFERT DU PANIER : On prend celui stocké dans PendingUser
            cart: pendingUser.cart || [] 
        });

        await newUser.save();
        await PendingUser.deleteOne({ _id: pendingUser._id });

        return res.status(200).json({ message: "Compte validé !" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error });
    }
};

// --- LOGIN ---
exports.login = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });
        
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET', { expiresIn: '24h' });

        return res.status(200).json({ 
            userId: user._id, 
            token, 
            firstName: user.firstName, 
            companyName: user.companyName,
            cart: user.cart 
        });
    } catch (error) {
        return res.status(500).json({ message: "Erreur serveur", error });
    }
};

exports.getCart = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.auth.userId });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
        return res.status(200).json(user.cart);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

exports.saveCart = async (req, res, next) => {
    try {
        const { cart } = req.body;
        console.log("💾 SAUVEGARDE BDD pour", req.auth.userId);
        await User.updateOne({ _id: req.auth.userId }, { $set: { cart: cart } });
        return res.status(200).json({ message: "Panier sauvegardé !" });
    } catch (error) {
        console.error("❌ ERREUR SAVE CART:", error);
        return res.status(500).json({ error });
    }
};