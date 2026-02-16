const express = require('express');
const router = express.Router();
const multer = require('multer');
const { sendContactFormEmail } = require('../utils/nodemailer');

// Configuration Multer (stockage temporaire en mémoire pour l'envoi)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5MB
});

// Route POST /api/contact
router.post('/contact', upload.single('attachment'), async (req, res) => {
    try {
        const { nom, prenom, email, phone, objet, message, consent } = req.body;
        const file = req.file; // Le fichier joint s'il y en a un

        if (consent !== 'true') {
            return res.status(400).json({ message: "Vous devez accepter le traitement des données." });
        }

        // Envoi de l'email
        await sendContactFormEmail({ nom, prenom, email, phone, objet, message }, file);

        res.status(200).json({ message: "Message envoyé avec succès !" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de l'envoi du message." });
    }
});

module.exports = router;