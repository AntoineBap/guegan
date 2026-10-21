const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new Error("missing token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.auth = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: "Session invalide ou expirée." });
  }
};
