const nodemailer = require('nodemailer');
require('dotenv').config();
// On récupère l'URL du FRONTEND pour faire des liens cliquables dans les emails
// "http://localhost:5173" est ton port local par défaut pour Vite
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const transporter = nodemailer.createTransport({
    service: 'gmail', // Ou autre (Outlook, etc.)
    auth: {
        user: process.env.EMAIL_USER, // Ton email (ex: contact@guegan.fr)
        pass: process.env.EMAIL_PASS  // Ton mot de passe d'application (PAS ton mdp normal)
    }
});

exports.sendVerificationEmail = async (email, token) => {
    const verificationLink = `${CLIENT_URL}/verify-email/${token}`; // URL du Frontend

    const mailOptions = {
        from: '"Guegan Configurator" <no-reply@guegan.fr>',
        to: email,
        subject: 'Confirmation de votre compte Pro',
        html: `
            <h1>Bienvenue chez Guegan !</h1>
            <p>Merci de vous être inscrit. Pour activer votre compte professionnel et accéder aux tarifs, veuillez cliquer sur le lien ci-dessous :</p>
            <a href="${verificationLink}" style="padding: 10px 20px; background-color: #d4af37; color: white; text-decoration: none; border-radius: 5px;">Confirmer mon email</a>
            <p>Ce lien est valide pendant 24 heures.</p>
        `
    };

    return transporter.sendMail(mailOptions);
};