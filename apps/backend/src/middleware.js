import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

// Attach a unique request ID for logging correlation
export function attachRequestId(req, res, next) {
  req.id = uuidv4();
  res.setHeader("X-Request-ID", req.id);
  next();
}

// JWT authentication middleware
export function authJwt(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Chybí token" } });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // payload contains { id, username, role, homeStorageCode }
    if (!req.user.active) throw new Error("inactive"); // optionally handle inactive user
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Neplatný nebo expirovaný token" } });
  }
}

// Role-based access control middleware
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Nedostatečná oprávnění" } });
    }
    next();
  };
}

// Unified error handling middleware
export function errorHandler(err, req, res, next) {
  console.error(`Error [${req.id}]:`, err);
  if (res.headersSent) {
    return next(err);
  }
  // If error already has status and message, use it
  const status = err.status || 500;
  const code = err.code || (status === 500 ? "SERVER_ERROR" : "ERROR");
  const message = err.message || "Interní chyba serveru";
  res.status(status).json({ error: { code, message } });
}
