// File: apps/backend/src/middleware/authJwt.js
import jwt from "jsonwebtoken";

/**
 * Ověří JWT z Authorization: Bearer <token>
 * a přidá do req.user { id, role, username }.
 */
export default function authJwt(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const [, token] = hdr.split(" ");
    if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: { code: "SERVER_CONFIG", message: "JWT_SECRET missing" } });

    const payload = jwt.verify(token, secret);
    // očekáváme aspoň { id, role, username }
    req.user = {
      id: payload.id,
      role: payload.role,
      username: payload.username,
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
}
