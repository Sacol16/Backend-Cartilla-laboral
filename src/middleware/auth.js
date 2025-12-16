const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, role, groupId?, facilitatorId? }
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid/expired token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "Unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ ok: false, error: "Forbidden" });
    next();
  };
}

module.exports = { authRequired, requireRole };
