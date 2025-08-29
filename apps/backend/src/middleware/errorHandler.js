// File: apps/backend/src/middleware/errorHandler.js
/**
 * Centrální error handler (musí být poslední .use v app).
 */
export default function errorHandler(err, _req, res, _next) {
  // Mírně detailní, ale bezpečné logování
  console.error(err);

  // Sequelize/DB chyby
  if (err?.name === "SequelizeDatabaseError" || err?.name?.startsWith?.("Sequelize")) {
    return res.status(500).json({ error: { code: "DB_ERROR", message: err.message } });
  }

  // Explicitně hozené chyby s kódem
  if (err?.status && err?.message) {
    return res.status(err.status).json({ error: { code: err.code || "ERROR", message: err.message } });
  }

  // Fallback
  return res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected error" } });
}
