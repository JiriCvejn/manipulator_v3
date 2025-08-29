// apps/backend/src/routes/orders.js
import express from "express";
import { body, param } from "express-validator";
import { Order, Route } from "../models/initModels.js";
import authJwt from "../middleware/authJwt.js";
import requireRole from "../middleware/requireRole.js";
import validate from "../middleware/validate.js";

const router = express.Router();

// POST /orders - založit objednávku (Admin+Operátor)
router.post(
  "/",
  authJwt,
  requireRole("admin", "operator"),
  body("from").isString(),
  body("to").isString(),
  body("urgency").isIn(["STANDARD", "URGENT"]),
  validate,
  async (req, res, next) => {
    try {
      const { from, to, urgency, note } = req.body;
      const exists = await Route.findOne({ where: { fromCode: from, toCode: to } });
      if (!exists) {
        return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Invalid route" } });
      }
      const order = await Order.create({ fromCode: from, toCode: to, urgency, note });
      // emit SSE
      req.app.get("eventBus").emit("publish", { type: "order.created", payload: order.toJSON() });
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }
);

// GET /orders/metrics?status=new - metriky pro Operátora
router.get("/metrics", authJwt, requireRole("admin", "operator"), async (req, res, next) => {
  try {
    const status = req.query.status || "new";
    const metrics = await Order.sequelize.query(
      `
      SELECT from_code AS "from",
             COUNT(*) AS count,
             BOOL_OR(urgency='URGENT') AS "hasUrgent",
             MIN(created_at) AS "oldestCreatedAt",
             EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))/60.0 AS "ageMinutes"
      FROM orders
      WHERE status = :status
      GROUP BY from_code;
    `,
      { replacements: { status }, type: Order.sequelize.QueryTypes.SELECT }
    );
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

// Worker fronta: GET /orders?status=new
router.get("/", authJwt, requireRole("admin", "worker"), async (req, res, next) => {
  try {
    const status = req.query.status || "new";
    const orders = await Order.findAll({ where: { status }, order: [["createdAt", "ASC"]] });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// POST /orders/:id/take - vzít úkol
router.post(
  "/:id/take",
  authJwt,
  requireRole("worker", "admin"),
  param("id").isInt(),
  validate,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const [updated] = await Order.update(
        { status: "in_progress", assigneeId: req.user.id, takenAt: new Date() },
        { where: { id, status: "new" } }
      );
      if (!updated) return res.status(409).json({ error: { code: "CONFLICT", message: "Order already taken" } });
      const order = await Order.findByPk(id);
      req.app.get("eventBus").emit("publish", { type: "order.status_changed", payload: order.toJSON() });
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
);

// POST /orders/:id/done - dokončit úkol
router.post(
  "/:id/done",
  authJwt,
  requireRole("worker", "admin"),
  param("id").isInt(),
  validate,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const [updated] = await Order.update(
        { status: "done", doneAt: new Date() },
        { where: { id, status: "in_progress", assigneeId: req.user.id } }
      );
      if (!updated) return res.status(409).json({ error: { code: "CONFLICT", message: "Order not in progress" } });
      const order = await Order.findByPk(id);
      req.app.get("eventBus").emit("publish", { type: "order.status_changed", payload: order.toJSON() });
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
);

// POST /orders/:id/cancel - zrušit úkol
router.post(
  "/:id/cancel",
  authJwt,
  requireRole("admin", "operator", "worker"),
  param("id").isInt(),
  body("reason").optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const order = await Order.findByPk(id);
      if (!order) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Order not found" } });

      // RBAC: Manipulant smí rušit jen new
      if (req.user.role === "worker" && order.status !== "new") {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Worker can cancel only new orders" } });
      }

      order.status = "canceled";
      order.canceledAt = new Date();
      await order.save();

      req.app.get("eventBus").emit("publish", { type: "order.status_changed", payload: order.toJSON() });
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
