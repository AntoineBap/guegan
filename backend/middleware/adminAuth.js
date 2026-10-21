const User = require("../models/User");

// Le rôle est relu en base : un token émis avant qu'un compte perde ses droits
// admin (ou soit supprimé) ne donne plus accès à l'administration.
module.exports = async (req, res, next) => {
  try {
    if (req.auth?.role !== "admin") throw new Error("not admin");
    const user = await User.findById(req.auth.userId).select("role").lean();
    if (user?.role !== "admin") throw new Error("not admin");
    next();
  } catch {
    res.status(403).json({ message: "Accès refusé. Droits administrateur requis." });
  }
};
