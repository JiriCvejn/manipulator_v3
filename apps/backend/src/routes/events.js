// apps/backend/src/routes/events.js
import express from "express";
import authJwt from "../middleware/authJwt.js";

const router = express.Router();

/**
 * SSE endpoint
 * Kanály dle role:
 * - Operator: metrics.updated, order.status_changed
 * - Worker: order.created, order.status_changed
 */
router.get("/", authJwt, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const role = req.query.role;
  const userId = req.query.userId;
  const home = req.query.home;

  // okamžitě po připojení heartbeat
  res.write(`event: ping\ndata: "connected"\n\n`);

  const interval = setInterval(() => {
    res.write(`event: ping\ndata: "keepalive"\n\n`);
  }, 25000);

  // jednoduchý pub/sub (v1: in-memory; v2: Redis Pub/Sub)
  const listener = (event) => {
    if (role === "operator") {
      if (event.type === "metrics.updated" || event.type === "order.status_changed") {
        if (!home || event.payload.from === home) {
          res.write(`event: ${event.type}\n`);
          res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
        }
      }
    }
    if (role === "worker") {
      if (event.type === "order.created" || event.type === "order.status_changed") {
        if (!userId || event.payload.assigneeId == userId || event.type === "order.created") {
          res.write(`event: ${event.type}\n`);
          res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
        }
      }
    }
  };

  req.app.get("eventBus").on("publish", listener);

  req.on("close", () => {
    clearInterval(interval);
    req.app.get("eventBus").off("publish", listener);
  });
});

export default router;
