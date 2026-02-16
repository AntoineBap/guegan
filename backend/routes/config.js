// routes/config.js
const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/admin");

router.get(
  "/global",
  (req, res, next) => {
    req.params.key = "global_settings";
    next();
  },
  adminCtrl.getSettings,
);

module.exports = router;
