const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration BREVO optimisée pour RENDER (Port 465)
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 465,              // On passe en 465 (SSL) au lieu de 587
    secure: true,           // DOIT être true pour le port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- AJOUT : VÉRIFICATION AU DÉMARRAGE ---
// Cela va afficher dans les logs de Render si la connexion au mail réussit ou échoue au démarrage du serveur
transporter.verify(function (error, success) {
    if (error) {
        console.log("🔴 ERREUR CRITIQUE SMTP :", error);
    } else {
        console.log("🟢 Serveur Mail prêt à envoyer des messages");
    }
});

exports.sendVerificationEmail = async (email, token) => {
    // URL dynamique (Prod ou Local)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email/${token}`; 

    // ATTENTION A CETTE LIGNE :
    // L'email dans 'from' DOIT être exactement celui que tu utilises pour te connecter à Brevo
    // (sauf si tu as validé un nom de domaine entier sur Brevo)
    const senderEmail = process.env.EMAIL_USER; // On utilise l'email du compte pour être sûr

    const mailOptions = {
        from: `"Guegan Configurator" <${senderEmail}>`, 
        to: email,
        subject: 'Confirmation de votre compte Pro',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Bienvenue chez Guegan !</h1>
                <p>Merci de vous être inscrit. Pour activer votre compte, cliquez ci-dessous :</p>
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #d4af37; color: white; text-decoration: none; border-radius: 5px;">Confirmer mon email</a>
            </div>
        `
    };

    console.log(`Tentative d'envoi de mail à ${email} via ${senderEmail}...`);
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email envoyé avec succès : ", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ ERREUR D'ENVOI DANS LE CATCH :", error);
        throw error;
    }
};