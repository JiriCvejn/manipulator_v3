import express from "express";
import PriorityRule from "../models/PriorityRule.js";
import AuditLog from "../models/AuditLog.js";
const router = express.Router();

// List all priority rules
router.get("/", async (_req, res, next) => {
  try {
    const rules = await PriorityRule.findAll();
    res.json(rules);
  } catch (err) { next(err); }
});

// Create a new priority rule
router.post("/", async (req, res, next) => {
  const { from, to, defaultUrgency, enabled } = req.body;
  try {
    const rule = await PriorityRule.create({ scope: "route", fromCode: from, toCode: to, defaultUrgency, enabled });
    // Audit
    await AuditLog.create({ 
      actorId: req.user.id, action: "PRIORITY_RULE_UPSERT", entityType: "PRIORITY_RULE", entityId: String(rule.id),
      meta: { from, to, defaultUrgency, enabled }
    });
    res.status(201).json(rule);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ error: { code: "CONFLICT", message: "Pravidlo pro tuto trasu již existuje" } });
    } else { next(err); }
  }
});

// Update (partial) a priority rule
router.patch("/:id", async (req, res, next) => {
  try {
    const rule = await PriorityRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Pravidlo nenalezeno" } });
    const updated = await rule.update(req.body);
    // Audit
    await AuditLog.create({ 
      actorId: req.user.id, action: "PRIORITY_RULE_UPSERT", entityType: "PRIORITY_RULE", entityId: String(rule.id),
      meta: { updatedFields: req.body }
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// Delete a priority rule
router.delete("/:id", async (req, res, next) => {
  try {
    const rule = await PriorityRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Pravidlo nenalezeno" } });
    await rule.destroy();
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
