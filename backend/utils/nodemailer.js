const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    },
    // --- AJOUT ICI ---
    family: 4 // Force l'utilisation de l'IPv4 au lieu de l'IPv6
});

exports.sendVerificationEmail = async (email, token) => {
    // On définit l'URL dynamiquement (localhost par défaut si pas de variable)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email/${token}`;

    const mailOptions = {
        from: '"Guegan Configurator" <no-reply@guegan.fr>',
        to: email,
        subject: 'Confirmation de votre compte Pro',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Bienvenue chez Guegan !</h1>
                <p>Merci de vous être inscrit. Pour activer votre compte professionnel et accéder aux tarifs, veuillez cliquer sur le lien ci-dessous :</p>
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #d4af37; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Confirmer mon email</a>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">Ce lien est valide pendant 24 heures.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};