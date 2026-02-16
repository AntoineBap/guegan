const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;
    const role = decodedToken.role;
    req.auth = { userId, role };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
