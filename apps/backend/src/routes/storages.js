import express from "express";
import { body, param } from "express-validator";
import validate from "../middleware/validate.js";
import authJwt from "../middleware/authJwt.js";
import requireRole from "../middleware/requireRole.js";
import Storage from "../models/Storage.js";

const router = express.Router();

// chráněno a jen pro admina
router.use(authJwt, requireRole("admin"));

/**
 * GET /storages
 */
router.get("/", async (_req, res, next) => {
  try {
    const items = await Storage.findAll({
      attributes: ["id", "code", "name", "type", "active", "createdAt", "updatedAt"],
      order: [["id", "ASC"]],
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /storages
 * Body: { code, name, type, active? }
 */
router.post(
  "/",
  body("code")
    .exists().withMessage("code is required")
    .bail()
    .isString().withMessage("code must be string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 5 }).withMessage("code must be 1-5 chars")
    .matches(/^[A-Za-z0-9]+$/).withMessage("code must be alphanumeric (A-Z,0-9)"),
  body("name")
    .exists().withMessage("name is required")
    .bail()
    .isString().withMessage("name must be string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("name must be 1-100 chars"),
  body("type")
    .exists().withMessage("type is required")
    .bail()
    .isString().withMessage("type must be string")
    .bail()
    .customSanitizer(v => String(v).toUpperCase())
    .isIn(["STORAGE", "LINE", "BUFFER"]).withMessage("type must be STORAGE | LINE | BUFFER"),
  body("active")
    .optional({ nullable: true })
    .toBoolean()
    .isBoolean().withMessage("active must be boolean"),
  validate,
  async (req, res, next) => {
    try {
      const { code, name, type } = req.body;
      const active = req.body.active ?? true;

      const exists = await Storage.findOne({ where: { code } });
      if (exists) {
        return res.status(409).json({ error: { code: "CONFLICT", message: "Storage code already exists" } });
      }

      const created = await Storage.create({ code: code.toUpperCase(), name, type, active });
      res.status(201).json({
        id: created.id,
        code: created.code,
        name: created.name,
        type: created.type,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * PATCH /storages/:id
 * Body: { name?, type?, active? }
 */
router.patch(
  "/:id",
  param("id").isInt().withMessage("id must be integer"),
  body("name")
    .optional()
    .isString().withMessage("name must be string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("name must be 1-100 chars"),
  body("type")
    .optional()
    .isString().withMessage("type must be string")
    .bail()
    .customSanitizer(v => String(v).toUpperCase())
    .isIn(["STORAGE", "LINE", "BUFFER"]).withMessage("type must be STORAGE | LINE | BUFFER"),
  body("active")
    .optional({ nullable: true })
    .toBoolean()
    .isBoolean().withMessage("active must be boolean"),
  validate,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const item = await Storage.findByPk(id);
      if (!item) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Storage not found" } });
      }

      const { name, type } = req.body;
      const active = req.body.active;

      if (name !== undefined) item.name = name;
      if (type !== undefined) item.type = type;
      if (active !== undefined) item.active = active;

      await item.save();

      res.json({
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        active: item.active,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * DELETE /storages/:id
 */
router.delete(
  "/:id",
  param("id").isInt().withMessage("id must be integer"),
  validate,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const item = await Storage.findByPk(id);
      if (!item) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Storage not found" } });
      }
      await item.destroy();
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
