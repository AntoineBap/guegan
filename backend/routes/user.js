const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');
const auth = require('../middleware/auth');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);
router.get('/verify/:token', userCtrl.verifyEmail);
router.get('/cart', auth, userCtrl.getCart);
router.put('/cart', auth, userCtrl.saveCart);

module.exports = router;