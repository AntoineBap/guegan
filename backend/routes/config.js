const express = require("express");
const router = express.Router();
const { getSettingsDoc, GLOBAL_KEY } = require("../utils/settings");

// Route publique : tarifs et contraintes utilisés par le configurateur
router.get("/global", async (req, res, next) => {
  try {
    const doc = await getSettingsDoc(GLOBAL_KEY);
    res.set("Cache-Control", "public, max-age=60");
    res.status(200).json(doc);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
