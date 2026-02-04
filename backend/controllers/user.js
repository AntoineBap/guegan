const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Module natif Node.js pour générer le token
const User = require('../models/User');
const PendingUser = require('../models/PendingUser'); // Ton modèle temporaire avec TTL
const { sendVerificationEmail } = require('../utils/nodemailer'); // Ta fonction d'envoi de mail
const PasswordValidator = require('password-validator');
require('dotenv').config();

// --- CONFIGURATION VALIDATION MOT DE PASSE ---
const passwordSchema = new PasswordValidator();
passwordSchema
    .is().min(8)
    .is().max(100)
    .has().uppercase()
    .has().not().spaces();

// --- INSCRIPTION (STOCKAGE TEMPORAIRE) ---
exports.signup = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, companyName, companyAddress, siret, tvaNumber } = req.body;
        // 1. Validation des champs obligatoires
        if (!email || !password || !firstName || !lastName || !companyName || !companyAddress || !siret || !tvaNumber) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires." });
        }

        // 2. Regex Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Format de l'email invalide." });
        }

        // 3. Validation Mot de passe
        if (!passwordSchema.validate(password)) {
            return res.status(400).json({ 
                message: "Le mot de passe doit faire 8 caractères min, avec une majuscule et sans espaces." 
            });
        }

        // 4. Regex SIRET (14 chiffres)
        const siretRegex = /^\d{14}$/;
        if (!siretRegex.test(siret)) {
            return res.status(400).json({ message: "Le numéro SIRET doit contenir exactement 14 chiffres." });
        }

        // 5. Regex TVA (Basic check)
        const tvaRegex = /^[A-Z]{2}[A-Z0-9+*.]{8,15}$/; 
        if (!tvaRegex.test(tvaNumber)) {
             return res.status(400).json({ message: "Format du numéro de TVA invalide (Ex: FR12345678901)." });
        }

        // 6. Vérifier si l'utilisateur existe déjà (Table Finale)
        const existingUser = await User.findOne({ $or: [{ email: email }, { siret: siret }] });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email ou ce numéro SIRET est déjà enregistré." });
        }

        // 7. Vérifier si une inscription est déjà en attente (Table Temporaire)
        const existingPending = await PendingUser.findOne({ email: email });
        if (existingPending) {
            return res.status(400).json({ message: "Un lien de confirmation a déjà été envoyé à cet email. Vérifiez vos spams." });
        }
        
        // 8. Hashage et Token
        const hash = await bcrypt.hash(password, 10);
        const validationToken = crypto.randomBytes(32).toString('hex'); // Token aléatoire
        
        // 9. Sauvegarde dans PENDING (disparaît dans 24h si non validé)
        const pendingUser = new PendingUser({
            email,
            password: hash,
            firstName,
            lastName,
            companyName,
            companyAddress,
            siret,
            tvaNumber,
            validationToken: validationToken
        });

        await pendingUser.save();

       tus(500).json({ message: "Erreur lors de l'envoi du mail", error: emailError.messag
e });
        }
        
        return res.status(201).json({ 
            message: 'Inscription réussie ! Un lien de validation a été envoyé à votre adresse email.' 
        });

    } catch (error) {
        console.error("Erreur Signup:", error);
        return res.status(500).json({ message: "Erreur serveur lors de l'inscription", error });
    }
};

// --- VALIDATION EMAIL (TRANSFERT VERS USER FINAL) ---
exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        // 1. Chercher dans la table temporaire
        const pendingUser = await PendingUser.findOne({ validationToken: token });

        if (!pendingUser) {
            return res.status(400).json({ message: "Lien invalide ou expiré (le lien est valide 24h)." });
        }

        // 2. Transférer vers la table User définitive
        const newUser = new User({
            email: pendingUser.email,
            password: pendingUser.password, // Déjà hashé
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            companyName: pendingUser.companyName,
            companyAddress: pendingUser.companyAddress,
            siret: pendingUser.siret,
            tvaNumber: pendingUser.tvaNumber
        });

        await newUser.save();

        // 3. Supprimer de la table temporaire
        await PendingUser.deleteOne({ _id: pendingUser._id });

        return res.status(200).json({ message: "Compte validé avec succès !" });

    } catch (error) {
        console.error("Erreur Validation:", error);
        return res.status(500).json({ message: "Erreur serveur lors de la validation", error });
    }
};

// --- CONNEXION (LOGIN) ---
exports.login = async (req, res, next) => {
    try {
        // Recherche dans la table DEFINITIVE uniquement
        const user = await User.findOne({ email: req.body.email });
        
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé ou mot de passe incorrect' });
        }
        
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Utilisateur non trouvé ou mot de passe incorrect' });
        }

        const tokenSecret = process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET';

        const token = jwt.sign(
            { userId: user._id },
            tokenSecret,
            { expiresIn: '24h' }
        );

        return res.status(200).json({ 
            userId: user._id, 
            token: token,
            firstName: user.firstName,
            companyName: user.companyName
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

// 2. Mettre à jour le panier (Sauvegarde auto)
exports.saveCart = async (req, res, next) => {
    try {
        const { cart } = req.body; // On reçoit le tableau d'items
        
        await User.updateOne(
            { _id: req.auth.userId },
            { $set: { cart: cart } }
        );
        
        return res.status(200).json({ message: "Panier sauvegardé !" });
    } catch (error) {
        return res.status(500).json({ error });
    }
};