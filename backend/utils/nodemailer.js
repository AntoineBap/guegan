const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. On configure manuellement le serveur SMTP de Google
// On n'utilise plus "service: 'gmail'" pour éviter les conflits IPv6
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,              // Port 587 (TLS) est beaucoup plus fiable que 465 pour le localhost
    secure: false,          // Doit être false pour le port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        ciphers: 'SSLv3',          // Aide à la compatibilité
        rejectUnauthorized: false  // Empêche certaines erreurs de certificat en local
    }
});

exports.sendVerificationEmail = async (email, token) => {
    // URL dynamique (Prod ou Local)
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