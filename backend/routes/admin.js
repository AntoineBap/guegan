const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin'); 
const auth = require('../middleware/auth'); 

router.get('/stats', auth, adminCtrl.getDashboardStats);
router.get('/orders/:status', auth, adminCtrl.getOrdersByStatus);
router.put('/order/:id', auth, adminCtrl.updateOrderStatus);
router.get('/order-details/:id', auth, adminCtrl.getOrderDetails);

module.exports = router;