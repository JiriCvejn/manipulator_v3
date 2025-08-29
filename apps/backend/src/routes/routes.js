// apps/backend/src/routes/routes.js
import express from "express";
import { body, param, query } from "express-validator";
import validate from "../middleware/validate.js";
import authJwt from "../middleware/authJwt.js";
import requireRole from "../middleware/requireRole.js";
import Route from "../models/Route.js";
import Storage from "../models/Storage.js";
import { Op } from "sequelize";

const router = express.Router();

router.use(authJwt, requireRole("admin"));

router.get(
  "/",
  query("fromCode").optional().isString().trim().isLength({ min: 1, max: 5 }),
  validate,
  async (req, res, next) => {
    try {
      const where = {};
      if (req.query.fromCode) where.fromCode = String(req.query.fromCode).toUpperCase();
      const items = await Route.findAll({
        where,
        order: [["fromCode", "ASC"], ["toCode", "ASC"]],
        attributes: ["id", "fromCode", "toCode"],
      });
      res.json(items);
    } catch (e) { next(e); }
  }
);

router.post(
  "/",
  body("fromCode").exists().isString().trim().isLength({ min: 1, max: 5 }),
  body("toCode").exists().isString().trim().isLength({ min: 1, max: 5 }),
  validate,
  async (req, res, next) => {
    try {
      const fromCode = String(req.body.fromCode).toUpperCase();
      const toCode = String(req.body.toCode).toUpperCase();
      const storages = await Storage.findAll({ where: { code: { [Op.in]: [fromCode, toCode] } }, attributes: ["code"] });
      const have = new Set(storages.map(s => s.code));
      if (!have.has(fromCode) || !have.has(toCode)) {
        return res.status(422).json({ error: { code: "UNPROCESSABLE", message: "Unknown storage code (fromCode/toCode)" } });
      }
      const [created, isNew] = await Route.findOrCreate({ where: { fromCode, toCode }, defaults: { fromCode, toCode } });
      if (!isNew) return res.status(409).json({ error: { code: "CONFLICT", message: "Route already exists" } });
      res.status(201).json({ id: created.id, fromCode, toCode });
    } catch (e) { next(e); }
  }
);

router.post(
  "/bulk",
  body("fromCode").exists().isString().trim().isLength({ min: 1, max: 5 }),
  body("toCodes").isArray({ min: 1 }),
  body("toCodes.*").isString().trim().isLength({ min: 1, max: 5 }),
  validate,
  async (req, res, next) => {
    try {
      const fromCode = String(req.body.fromCode).toUpperCase().trim();
      const toCodes = Array.from(new Set(
        req.body.toCodes.map(c => String(c||"").toUpperCase().trim()).filter(c => c && c !== fromCode)
      ));
      if (toCodes.length === 0) return res.status(400).json({ error: { code: "BAD_REQUEST", message: "toCodes must contain at least one target different from fromCode" } });

      const need = [fromCode, ...toCodes];
      const storages = await Storage.findAll({ where: { code: { [Op.in]: need } }, attributes: ["code"] });
      const have = new Set(storages.map(s => s.code));
      const missing = need.filter(c => !have.has(c));
      if (missing.length > 0) return res.status(422).json({ error: { code: "UNPROCESSABLE", message: "Unknown storage code(s)", details: { missing } } });

      const rows = toCodes.map(toCode => ({ fromCode, toCode }));
      const created = await Route.bulkCreate(rows, { ignoreDuplicates: true, returning: true });
      const out = created.map(r => ({ id: r.id, fromCode: r.fromCode, toCode: r.toCode }));
      res.status(201).json(out);
    } catch (e) { next(e); }
  }
);

router.delete(
  "/:id",
  param("id").isInt(),
  validate,
  async (req, res, next) => {
    try {
      const r = await Route.findByPk(Number(req.params.id));
      if (!r) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
      await r.destroy();
      res.status(204).send();
    } catch (e) { next(e); }
  }
);

export default router;
