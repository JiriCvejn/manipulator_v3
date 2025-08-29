// File: apps/backend/src/middleware/attachRequestId.js
import { randomUUID } from "crypto";

/**
 * Přidá každému požadavku unikátní ID (req.id) pro tracing.
 */
export default function attachRequestId(req, _res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  next();
}
