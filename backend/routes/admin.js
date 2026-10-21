const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/admin");
const quoteCtrl = require("../controllers/quoteController");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// Toutes les routes admin exigent un token valide ET un rôle admin vérifié en base
router.use(auth, adminAuth);

router.get("/stats", adminCtrl.getDashboardStats);
router.get("/orders/:status", adminCtrl.getOrdersByStatus);
router.put("/order/:id", adminCtrl.updateOrderStatus);
router.get("/order-details/:id", adminCtrl.getOrderDetails);
router.delete("/order/:id", adminCtrl.deleteOrder);
router.put("/order/:id/rollback", adminCtrl.rollbackOrderStatus);
router.get("/users-export", adminCtrl.getAllUsersWithCarts);
router.get("/settings/:key", adminCtrl.getSettings);
router.post("/settings", adminCtrl.updateSettings);
router.get("/quotes", quoteCtrl.getAllQuotes);
router.get("/quotes/:id", quoteCtrl.getQuoteById);

module.exports = router;
