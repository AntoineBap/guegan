const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration BREVO (Plus robuste pour Render/Vercel)
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // Serveur Brevo
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER, // Ton identifiant Brevo
        pass: process.env.EMAIL_PASS  // Ta clé SMTP Brevo (pas ton mot de passe de compte)
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.sendVerificationEmail = async (email, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email/${token}`; 

    const mailOptions = {
        from: '"Guegan Configurator" <antoinebaptista030604@gmail.com>', // Doit être une adresse validée dans Brevo (Expéditeurs)
        to: email,
        subject: 'Confirmation de votre compte Pro',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Bienvenue chez Guegan !</h1>
                <p>Pour activer votre compte, cliquez ci-dessous :</p>
                <a href="${verificationLink}">Confirmer mon email</a>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};