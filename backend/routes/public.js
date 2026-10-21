const express = require("express");
const router = express.Router();
const multer = require("multer");
const { sendContactFormEmail } = require("../utils/nodemailer");
const { contactLimiter } = require("../middleware/rateLimit");

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/dxf",
  "image/vnd.dxf",
  "application/acad",
  "image/vnd.dwg",
]);
const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp|heic|docx?|xlsx?|dxf|dwg)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED_EXT.test(file.originalname) &&
      (ALLOWED_MIME.has(file.mimetype) || file.mimetype === "application/octet-stream");
    if (!ok) {
      const err = new Error("Type de fichier non autorisé (PDF, image, Word, Excel, DXF/DWG).");
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

router.post("/contact", contactLimiter, upload.single("attachment"), async (req, res) => {
  try {
    const data = {
      nom: str(req.body.nom, 80),
      prenom: str(req.body.prenom, 80),
      email: str(req.body.email, 160),
      phone: str(req.body.phone, 30),
      objet: str(req.body.objet, 150),
      message: str(req.body.message, 5000),
    };

    if (req.body.consent !== "true") {
      return res
        .status(400)
        .json({ message: "Vous devez accepter le traitement des données." });
    }
    if (!data.nom || !data.prenom || !data.objet || !data.message || !EMAIL_RE.test(data.email)) {
      return res.status(400).json({ message: "Merci de remplir tous les champs obligatoires." });
    }

    await sendContactFormEmail(data, req.file);
    res.status(200).json({ message: "Message envoyé avec succès !" });
  } catch (error) {
    console.error("Erreur contact :", error.message);
    res.status(500).json({ message: "Erreur lors de l'envoi du message." });
  }
});

module.exports = router;
