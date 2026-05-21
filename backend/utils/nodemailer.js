const SibApiV3Sdk = require("sib-api-v3-sdk");
require("dotenv").config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const iban = process.env.BANK_IBAN || "IBAN non configuré";
const bic = process.env.BANK_BIC || "BIC non configuré";

const SENDER = {
  email: "no-reply@etsguegan.com",
  name: "Guegan Shop",
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const emailHeader = () => `
  <div style="background-color: #111111; padding: 28px 40px; text-align: center;">
    <div style="font-family: 'Manrope', sans-serif; font-size: 20px; font-weight: 800; color: #d4af37; letter-spacing: 4px; text-transform: uppercase;">
      Guegan Shop
    </div>
    <div style="font-family: 'Manrope', Arial, sans-serif; font-size: 11px; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px;">
      Plans Vasques Sur-Mesure · Solid Surface®
    </div>
  </div>
  <div style="height: 3px; background: linear-gradient(to right, #b8941e, #d4af37, #f0d060, #d4af37, #b8941e);"></div>
`;

const emailFooter = () => `
  <div style="height: 3px; background: linear-gradient(to right, #b8941e, #d4af37, #f0d060, #d4af37, #b8941e); margin-top: 40px;"></div>
  <div style="background-color: #111111; padding: 24px 40px; text-align: center;">
    <p style="font-family: 'Manrope', Arial, sans-serif; font-size: 12px; color: #666; margin: 0 0 6px;">
      1 rue de l'Industrie · 93000 Bobigny
    </p>
    <p style="font-family: 'Manrope', Arial, sans-serif; font-size: 12px; color: #666; margin: 0 0 6px;">
      <a href="tel:0148400505" style="color: #888; text-decoration: none;">01 48 40 05 05</a>
      &nbsp;·&nbsp;
      <a href="mailto:contact@etsguegan.com" style="color: #888; text-decoration: none;">contact@etsguegan.com</a>
    </p>
    <p style="font-family: 'Manrope', Arial, sans-serif; font-size: 11px; color: #444; margin: 12px 0 0;">
      Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
    </p>
  </div>
`;

const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10);">
          <tr><td>${emailHeader()}</td></tr>
          <tr><td style="padding: 36px 40px; font-family: 'Manrope', Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.7;">${content}</td></tr>
          <tr><td>${emailFooter()}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const goldDivider = () => `<div style="height: 1px; background: linear-gradient(to right, transparent, #d4af37, transparent); margin: 24px 0;"></div>`;

const badge = (text, color = "#d4af37", bg = "#1a1a1a") => `
  <span style="display: inline-block; background: ${bg}; color: ${color}; border: 1px solid ${color}; padding: 4px 12px; border-radius: 3px; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">${text}</span>
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. EMAIL DE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
exports.sendVerificationEmail = async (email, token) => {
  if (!email) return;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendUrl}/verify/${token}`;

  const content = `
    <p style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Activation de compte</p>
    <h2 style="font-family: 'Manrope', Arial, sans-serif; font-weight: 800; color: #111; margin: 0 0 20px; font-size: 22px;">Bienvenue chez Guegan Shop</h2>
    ${goldDivider()}
    <p>Merci de vous être inscrit sur notre plateforme professionnelle de commande de plans vasques sur-mesure.</p>
    <p>Pour activer votre compte et accéder à l'ensemble de nos services, veuillez confirmer votre adresse email :</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${link}" style="background-color: #d4af37; color: #111111; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">
        Activer mon compte
      </a>
    </div>
    <p style="font-size: 13px; color: #888;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
    <a href="${link}" style="color: #d4af37; word-break: break-all;">${link}</a></p>
    ${goldDivider()}
    <p style="font-size: 13px; color: #999;">Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.</p>
  `;

  await apiInstance.sendTransacEmail({
    sender: SENDER,
    to: [{ email }],
    subject: "Activez votre compte — Guegan Shop",
    htmlContent: emailWrapper(content),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. EMAIL DE CONFIRMATION COMMANDE
// ─────────────────────────────────────────────────────────────────────────────
exports.sendOrderConfirmationEmail = async (order, user) => {
  if (!user || !user.email) return;

  const total = order.totalAmount.toFixed(2);
  const tvaAmount = (order.totalAmount * 0.2).toFixed(2);
  const totalTTC = (order.totalAmount * 1.2).toFixed(2);

  const itemsRows = order.items.map((item, i) => `
    <tr style="background-color: ${i % 2 === 0 ? "#fafafa" : "#ffffff"};">
      <td style="padding: 12px 14px; border-bottom: 1px solid #eee;">
        <strong style="color: #111;">Plan Vasque Sur-Mesure</strong><br>
        <span style="font-size: 12px; color: #888;">${item.length} × ${item.width} mm</span>
      </td>
      <td style="padding: 12px 14px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 14px; border-bottom: 1px solid #eee; text-align: right; color: #111;">${(item.unitPrice * item.quantity).toFixed(2)} €</td>
    </tr>
  `).join("");

  const content = `
    <p style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Confirmation de commande</p>
    <h2 style="font-family: 'Manrope', Arial, sans-serif; font-weight: 800; color: #111; margin: 0 0 4px; font-size: 22px;">Votre commande est enregistrée</h2>
    <p style="color: #888; margin: 0 0 20px; font-size: 14px;">Référence : <strong style="color: #d4af37;">#${order.orderNumber}</strong></p>
    ${goldDivider()}

    <p>Bonjour <strong>${user.firstName} ${user.lastName || ""}</strong>,</p>
    <p>Nous avons bien reçu votre commande. Vous trouverez ci-dessous le récapitulatif ainsi que les instructions de paiement par virement bancaire.</p>

    ${goldDivider()}

    <p style="font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 10px;">Récapitulatif</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background-color: #111111; border-radius: 8px 8px 0 0;">
          <th style="padding: 12px 14px; text-align: left; color: #d4af37; font-weight: normal; letter-spacing: 1px; font-size: 12px; text-transform: uppercase;">Désignation</th>
          <th style="padding: 12px 14px; text-align: center; color: #d4af37; font-weight: normal; letter-spacing: 1px; font-size: 12px; text-transform: uppercase;">Qté</th>
          <th style="padding: 12px 14px; text-align: right; color: #d4af37; font-weight: normal; letter-spacing: 1px; font-size: 12px; text-transform: uppercase;">Montant HT</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px 14px; text-align: right; font-size: 13px; color: #888;">Total HT</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: bold; color: #111;">${total} €</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 4px 14px; text-align: right; font-size: 13px; color: #888;">TVA (20%)</td>
          <td style="padding: 4px 14px; text-align: right; color: #888;">${tvaAmount} €</td>
        </tr>
        <tr style="background-color: #111;">
          <td colspan="2" style="padding: 12px 14px; text-align: right; color: #d4af37; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 13px;">Total TTC</td>
          <td style="padding: 12px 14px; text-align: right; color: #d4af37; font-weight: bold; font-size: 16px;">${totalTTC} €</td>
        </tr>
      </tfoot>
    </table>

    ${goldDivider()}

    <p style="font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 12px;">Instructions de paiement</p>
    <div style="background-color: #fafafa; border: 1px solid #e8e0cc; border-left: 4px solid #d4af37; padding: 20px 24px; border-radius: 12px;">
      <p style="margin: 0 0 8px; font-size: 14px;">Merci d'effectuer un virement bancaire avec les informations suivantes :</p>
      <table cellpadding="0" cellspacing="0" style="font-size: 14px; margin-top: 12px;">
        <tr><td style="padding: 4px 20px 4px 0; color: #888; white-space: nowrap;">IBAN</td><td style="padding: 4px 0; font-weight: bold; color: #111; letter-spacing: 1px;">${iban}</td></tr>
        <tr><td style="padding: 4px 20px 4px 0; color: #888;">BIC</td><td style="padding: 4px 0; font-weight: bold; color: #111;">${bic}</td></tr>
        <tr><td style="padding: 4px 20px 4px 0; color: #888;">Motif</td><td style="padding: 4px 0; font-weight: bold; color: #d4af37;">Commande #${order.orderNumber}</td></tr>
      </table>
    </div>
    <p style="font-size: 13px; color: #888; margin-top: 16px;">Votre commande sera mise en fabrication dès réception du virement. Pour toute question, n'hésitez pas à nous contacter.</p>
  `;

  await apiInstance.sendTransacEmail({
    sender: SENDER,
    to: [{ email: user.email }],
    subject: `Commande #${order.orderNumber} confirmée — Guegan Shop`,
    htmlContent: emailWrapper(content),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMAIL STATUT
// ─────────────────────────────────────────────────────────────────────────────
exports.sendStatusUpdateEmail = async (order, user, status) => {
  if (!user || !user.email) return;

  let subject, message, icon, accentColor;

  if (status === "paid") {
    subject = "Paiement reçu — Fabrication lancée";
    message = "Nous avons bien reçu votre virement et votre commande est maintenant en cours de fabrication dans nos ateliers.";
    icon = "✓";
    accentColor = "#27ae60";
  } else if (status === "shipped") {
    subject = "Votre commande est expédiée";
    message = "Votre commande est terminée et a été remise au transporteur. Vous la recevrez dans les prochains jours.";
    icon = "→";
    accentColor = "#2980b9";
  } else {
    return;
  }

  const content = `
    <p style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Mise à jour de commande</p>
    <h2 style="font-family: 'Manrope', Arial, sans-serif; font-weight: 800; color: #111; margin: 0 0 4px; font-size: 22px;">${subject}</h2>
    <p style="color: #888; margin: 0 0 20px; font-size: 14px;">Référence : <strong style="color: #d4af37;">#${order.orderNumber}</strong></p>
    ${goldDivider()}

    <p>Bonjour <strong>${user.firstName} ${user.lastName || ""}</strong>,</p>

    <div style="background-color: #fafafa; border-left: 4px solid ${accentColor}; padding: 18px 24px; margin: 24px 0; border-radius: 12px;">
      <p style="margin: 0; font-size: 15px; color: #111;">${message}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="font-size: 14px; color: #555; margin-top: 8px;">
      <tr><td style="padding: 4px 20px 4px 0; color: #888;">Commande</td><td style="font-weight: bold; color: #d4af37;">#${order.orderNumber}</td></tr>
      <tr><td style="padding: 4px 20px 4px 0; color: #888;">Statut</td><td style="font-weight: bold; color: ${accentColor};">${status === "paid" ? "En fabrication" : "Expédiée"}</td></tr>
    </table>

    ${goldDivider()}
    <p style="font-size: 13px; color: #888;">Pour toute question, contactez-nous à <a href="mailto:contact@etsguegan.com" style="color: #d4af37;">contact@etsguegan.com</a> ou au 01 48 40 05 05.</p>
  `;

  await apiInstance.sendTransacEmail({
    sender: SENDER,
    to: [{ email: user.email }],
    subject: `${subject} — Guegan Shop`,
    htmlContent: emailWrapper(content),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. EMAIL DE CONTACT
// ─────────────────────────────────────────────────────────────────────────────
exports.sendContactFormEmail = async (data, file) => {
  const attachments = [];
  if (file) {
    attachments.push({
      name: file.originalname,
      content: file.buffer.toString("base64"),
    });
  }

  const content = `
    <p style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Formulaire de contact</p>
    <h2 style="font-family: 'Manrope', Arial, sans-serif; font-weight: 800; color: #111; margin: 0 0 20px; font-size: 22px;">Nouveau message reçu</h2>
    ${goldDivider()}

    <table cellpadding="0" cellspacing="0" style="font-size: 14px; width: 100%; margin-bottom: 20px;">
      <tr><td style="padding: 6px 20px 6px 0; color: #888; white-space: nowrap; width: 120px;">Expéditeur</td><td style="font-weight: bold; color: #111;">${data.prenom} ${data.nom}</td></tr>
      <tr><td style="padding: 6px 20px 6px 0; color: #888;">Email</td><td><a href="mailto:${data.email}" style="color: #d4af37;">${data.email}</a></td></tr>
      <tr><td style="padding: 6px 20px 6px 0; color: #888;">Téléphone</td><td style="color: #111;">${data.phone || "Non renseigné"}</td></tr>
      <tr><td style="padding: 6px 20px 6px 0; color: #888;">Objet</td><td style="font-weight: bold; color: #111;">${data.objet}</td></tr>
    </table>

    ${goldDivider()}

    <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 10px;">Message</p>
    <div style="background-color: #fafafa; border-left: 4px solid #d4af37; padding: 18px 24px; border-radius: 12px; font-size: 14px; line-height: 1.8; color: #333;">
      ${data.message.replace(/\n/g, "<br>")}
    </div>
    ${file ? `<p style="font-size: 13px; color: #888; margin-top: 16px;">📎 Pièce jointe : <strong>${file.originalname}</strong></p>` : ""}
  `;

  await apiInstance.sendTransacEmail({
    sender: SENDER,
    to: [{ email: "contact@etsguegan.com" }],
    replyTo: { email: data.email },
    subject: `[Contact] ${data.objet} — ${data.prenom} ${data.nom}`,
    htmlContent: emailWrapper(content),
    attachment: attachments.length > 0 ? attachments : undefined,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. RÉCAPITULATIF QUOTIDIEN DEVIS
// ─────────────────────────────────────────────────────────────────────────────
exports.sendDailyQuotesSummary = async (count) => {
  if (count <= 0) return;

  const content = `
    <p style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Récapitulatif quotidien</p>
    <h2 style="font-family: 'Manrope', Arial, sans-serif; font-weight: 800; color: #111; margin: 0 0 20px; font-size: 22px;">Activité du jour</h2>
    ${goldDivider()}

    <p>Bonjour,</p>
    <div style="background-color: #111; border-radius: 16px; padding: 32px 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 48px; font-weight: bold; color: #d4af37; line-height: 1;">${count}</div>
      <div style="font-size: 14px; color: #888; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">
        nouveau${count > 1 ? "x" : ""} devis créé${count > 1 ? "s" : ""}
      </div>
    </div>
    <p style="text-align: center; font-size: 13px; color: #888;">Connectez-vous à votre espace administrateur pour les consulter.</p>
  `;

  await apiInstance.sendTransacEmail({
    sender: SENDER,
    to: [{ email: "contact@etsguegan.com" }],
    subject: `${count} nouveau${count > 1 ? "x" : ""} devis — Guegan Shop`,
    htmlContent: emailWrapper(content),
  });
};