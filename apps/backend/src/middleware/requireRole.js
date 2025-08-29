// File: apps/backend/src/middleware/requireRole.js
/**
 * Zkontroluje, že přihlášený uživatel má jednu z povolených rolí.
 * Použití: requireRole("admin","operator") atd.
 */
export default function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No user in request" } });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient role" } });
    }
    next();
  };
}
