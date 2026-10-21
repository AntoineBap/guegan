const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");
const quoteCtrl = require("../controllers/quoteController");
const auth = require("../middleware/auth");
const { loginLimiter, emailLimiter, orderLimiter } = require("../middleware/rateLimit");

router.post("/signup", emailLimiter, userCtrl.signup);
router.post("/login", loginLimiter, userCtrl.login);
router.get("/verify/:token", userCtrl.verifyEmail);
router.post("/resend", emailLimiter, userCtrl.resendEmail);
router.get("/cart", auth, userCtrl.getCart);
router.post("/cart", auth, userCtrl.saveCart);
router.post("/order", auth, orderLimiter, userCtrl.createOrder);
router.get("/order/:id", auth, userCtrl.getOrder);
router.get("/my-orders", auth, userCtrl.getMyOrders);
router.post("/quotes", auth, orderLimiter, quoteCtrl.createQuote);
router.get("/my-quotes", auth, quoteCtrl.getMyQuotes);
router.delete("/quotes/:id", auth, quoteCtrl.deleteQuote);

router.get("/check-token", auth, (req, res) => {
  res.status(200).json({ message: "Token valide" });
});

// Profil utilisateur (l'id de l'URL est ignoré : on agit toujours sur le compte du token)
router.patch("/:id", auth, userCtrl.updateProfile);
router.patch("/:id/password", auth, loginLimiter, userCtrl.updatePassword);
router.delete("/:id", auth, userCtrl.deleteAccount);

module.exports = router;
