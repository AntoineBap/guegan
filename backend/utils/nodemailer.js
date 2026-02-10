require('dotenv').config();

exports.sendVerificationEmail = async (email, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email/${token}`; 
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) throw new Error("Clé API Brevo manquante");

    const emailData = {
        sender: { 
            name: "Guegan Configurator", 
            email: "antoinebaptista030604@gmail.com" // Utilise la variable d'env
        },
        to: [{ email: email }],
        subject: "Urgent : Activez votre compte (Valide 5 min)",
        htmlContent: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Bienvenue chez Guegan !</h1>
                <p>Pour activer votre compte, cliquez ci-dessous.</p>
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #d4af37; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Confirmer mon email</a>
                <p style="margin-top: 20px; color: #d9534f; font-weight: bold;">Attention : Ce lien expire dans 5 minutes.</p>
                <p style="font-size: 12px; color: #777;">Passé ce délai, vous devrez recommencer l'inscription.</p>
            </div>
        `
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            const errorDetail = await response.json();
            throw new Error(`Erreur API Brevo: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};