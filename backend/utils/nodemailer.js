// On n'a plus besoin de 'nodemailer' ici, on utilise fetch natif
require('dotenv').config();

exports.sendVerificationEmail = async (email, token) => {
    // 1. URL de confirmation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email/${token}`; 

    // 2. Préparation des données pour l'API Brevo
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.error("❌ ERREUR : La clé BREVO_API_KEY est manquante.");
        throw new Error("Configuration email manquante");
    }

    const emailData = {
        sender: { 
            name: "Guegan Configurator", 
            email: "antoinebaptista030604@gmail.com" // DOIT être ton email expéditeur validé sur Brevo
        },
        to: [
            { email: email }
        ],
        subject: "Confirmation de votre compte Pro",
        htmlContent: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Bienvenue chez Guegan !</h1>
                <p>Merci de vous être inscrit. Pour activer votre compte professionnel, veuillez cliquer sur le lien ci-dessous :</p>
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #d4af37; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Confirmer mon email</a>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">Ce lien est valide pendant 24 heures.</p>
            </div>
        `
    };

    try {
        console.log(`Tentative d'envoi via API Brevo à ${email}...`);

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey, // Authentification par clé API
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        // Gestion des erreurs HTTP (ex: clé invalide, quota dépassé)
        if (!response.ok) {
            const errorDetail = await response.json();
            console.error("❌ Erreur API Brevo :", JSON.stringify(errorDetail, null, 2));
            throw new Error(`Erreur API Brevo: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Email envoyé via API ! ID Message :", data.messageId);
        return data;

    } catch (error) {
        console.error("❌ Exception lors de l'envoi API :", error);
        throw error;
    }
};