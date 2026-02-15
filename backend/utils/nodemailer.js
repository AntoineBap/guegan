const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();


// Configuration du client API pour BREVO
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const iban = process.env.BANK_IBAN || 'IBAN non configuré';
const bic = process.env.BANK_BIC || 'BIC non configuré';

// Adresse d'expédition
const SENDER = { email: 'antoinebaptista030604@gmail.com', name: 'Guegan Shop' };

// --- 1. EMAIL DE VALIDATION ---
exports.sendVerificationEmail = async (email, token) => {
    if (!email) return;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${frontendUrl}/verify/${token}`;
    console.log("Lien de vérification généré :", link);
    
    await apiInstance.sendTransacEmail({
        sender: SENDER,
        to: [{ email: email }],
        subject: "Vérification de votre compte pro",
        htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #d4af37;">Bienvenue chez Guegan Shop</h1>
                <p>Veuillez cliquer sur le lien ci-dessous pour activer votre compte professionnel :</p>
                <a href="${link}" style="background: #111; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Activer mon compte</a>
            </div>
        `
    });
};

// --- 2. EMAIL DE CONFIRMATION COMMANDE ---
exports.sendOrderConfirmationEmail = async (order, user) => {
    if (!user || !user.email) return; 
    
    const total = order.totalAmount.toFixed(2);
    
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>Plan Vasque Sur-Mesure</strong><br/>
                <small>${item.length}x${item.width}mm</small>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${(item.unitPrice * item.quantity).toFixed(2)} €</td>
        </tr>
    `).join('');

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <h1 style="color: #27ae60; text-align: center;">Commande Confirmée !</h1>
            <p>Bonjour ${user.firstName},</p>
            <p>Nous avons bien reçu votre commande <strong>#${order.orderNumber}</strong>.</p>
            
            <h3>📦 Récapitulatif</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f8f9fa;">
                    <th style="padding: 10px; text-align: left;">Produit</th>
                    <th style="padding: 10px; text-align: left;">Qté</th>
                    <th style="padding: 10px; text-align: left;">Prix HT</th>
                </tr>
                ${itemsHtml}
            </table>
            
            <h3 style="text-align: right; margin-top: 20px;">Total HT : ${total} €</h3>

            <div style="background-color: #ffffcc; padding: 15px; border: 1px dashed #e3e3e3; margin-top: 20px;">
                <h4 style="margin-top: 0;">🏦 Instructions de Virement</h4>
                <p>Merci d'effectuer le virement vers le compte suivant :</p>
                <p><strong>IBAN :</strong> ${iban}<br/>
                <strong>BIC :</strong> ${bic}<br/>
                <strong>Motif :</strong> Commande #${order.orderNumber}</p>
            </div>
        </div>
    `;

    await apiInstance.sendTransacEmail({
        sender: SENDER,
        to: [{ email: user.email }],
        subject: `Confirmation de commande #${order.orderNumber}`,
        htmlContent: htmlContent
    });
};

// --- 3. EMAIL STATUT ---
exports.sendStatusUpdateEmail = async (order, user, status) => {
    if (!user || !user.email) return;

    let subject = "";
    let message = "";
    let color = "#333";

    if (status === 'paid') {
        subject = "Paiement reçu - Fabrication lancée";
        message = "Bonne nouvelle ! Nous avons bien reçu votre virement.";
        color = "#27ae60"; 
    } else if (status === 'shipped') {
        subject = "Votre commande est expédiée";
        message = "Votre commande est terminée et a été remise au transporteur.";
        color = "#2980b9"; 
    } else {
        return; 
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: ${color};">${subject}</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>${message}</p>
            <p><strong>Commande :</strong> #${order.orderNumber}</p>
            <br/>
        </div>
    `;

    await apiInstance.sendTransacEmail({
        sender: SENDER,
        to: [{ email: user.email }],
        subject: `Mise à jour : ${subject}`,
        htmlContent: htmlContent
    });
};