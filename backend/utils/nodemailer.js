const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

exports.sendVerificationEmail = async (email, token) => {
    // MODIFICATION ICI : On utilise une variable d'environnement
    // Si FRONTEND_URL existe (Prod), on l'utilise. Sinon on garde localhost (Dev).
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const verificationLink = `${frontendUrl}/verify-email/${token}`; 

    const mailOptions = {
        from: '"Guegan Configurator" <no-reply@guegan.fr>',
        to: email,
        subject: 'Confirmation de votre compte Pro',
        html: `
            <h1>Bienvenue chez Guegan !</h1>
            <p>Merci de vous être inscrit...</p>
            <a href="${verificationLink}">Confirmer mon email</a>
        `
    };

    return transporter.sendMail(mailOptions);
};