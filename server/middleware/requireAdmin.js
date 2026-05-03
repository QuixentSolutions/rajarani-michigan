const jwt = require("jsonwebtoken");

module.exports = function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied: admins only" });
    }
    req.admin = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};
