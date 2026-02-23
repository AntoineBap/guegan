const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/admin");
const quoteCtrl = require("../controllers/quoteController");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.get("/stats", auth, adminAuth, adminCtrl.getDashboardStats);
router.get("/orders/:status", auth, adminAuth, adminCtrl.getOrdersByStatus);
router.put("/order/:id", auth, adminAuth, adminCtrl.updateOrderStatus);
router.get("/order-details/:id", auth, adminAuth, adminCtrl.getOrderDetails);
router.delete("/order/:id", auth, adminAuth, adminCtrl.deleteOrder);
router.get("/users-export", auth, adminAuth, adminCtrl.getAllUsersWithCarts);
router.get("/settings/:key", auth, adminAuth, adminCtrl.getSettings);
router.post("/settings", auth, adminAuth, adminCtrl.updateSettings);
router.get("/quotes", auth, adminAuth, quoteCtrl.getAllQuotes);
router.get("/quotes/:id", auth, adminAuth, quoteCtrl.getQuoteById);

module.exports = router;
