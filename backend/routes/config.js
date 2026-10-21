const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { getSettingsDoc, getGlobalSettings, GLOBAL_KEY } = require("../utils/settings");

// Le configurateur n'affiche les prix qu'aux comptes connectés :
// les visiteurs ne reçoivent que les contraintes (dimensions, délai).
const isLoggedIn = (req) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
};

router.get("/global", async (req, res, next) => {
  try {
    res.set("Vary", "Authorization");

    if (isLoggedIn(req)) {
      res.set("Cache-Control", "private, no-cache");
      return res.status(200).json({ key: GLOBAL_KEY, value: await getGlobalSettings() });
    }

    const doc = await getSettingsDoc(GLOBAL_KEY);
    res.set("Cache-Control", "public, max-age=60");
    res.status(200).json(doc ? { key: doc.key, value: { constraints: doc.value?.constraints || {} } } : null);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
