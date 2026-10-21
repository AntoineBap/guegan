const rateLimit = require("express-rate-limit");

const make = (windowMinutes, limit, message, extra = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    ...extra,
  });

// Connexion : freine le brute-force de mots de passe.
// Seuls les échecs comptent : plusieurs collègues derrière la même IP ne se bloquent pas entre eux.
exports.loginLimiter = make(15, 10, "Trop de tentatives. Réessayez dans 15 minutes.", {
  skipSuccessfulRequests: true,
});

// Inscription / renvoi de mail : évite le spam d'emails via Brevo
exports.emailLimiter = make(60, 5, "Trop de demandes. Réessayez plus tard.");

// Formulaire de contact
exports.contactLimiter = make(60, 5, "Trop de messages envoyés. Réessayez plus tard.");

// Création de commandes / devis
exports.orderLimiter = make(60, 30, "Trop de requêtes. Réessayez plus tard.");
