const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");
const quoteCtrl = require("../controllers/quoteController");
const auth = require("../middleware/auth");

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);
router.get("/verify/:token", userCtrl.verifyEmail);
router.post("/resend", userCtrl.resendEmail);
router.get("/cart", auth, userCtrl.getCart);
router.post("/cart", auth, userCtrl.saveCart);
router.post("/order", auth, userCtrl.createOrder);
router.get("/order/:id", auth, userCtrl.getOrder);
router.get("/my-orders", auth, userCtrl.getMyOrders);
router.post("/quotes", auth, quoteCtrl.createQuote);
router.get("/my-quotes", auth, quoteCtrl.getMyQuotes);
router.delete("/quotes/:id", auth, quoteCtrl.deleteQuote);

module.exports = router;
