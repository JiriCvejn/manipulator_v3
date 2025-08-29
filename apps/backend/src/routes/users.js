import express from "express";
import { body, param } from "express-validator";
import bcrypt from "bcryptjs";
import validate from "../middleware/validate.js";
import requireRole from "../middleware/requireRole.js";
import authJwt from "../middleware/authJwt.js";
import User from "../models/User.js";

const router = express.Router();

// Všechny endpointy jen pro admina
router.use(authJwt, requireRole("admin"));

/**
 * GET /users
 * Seznam uživatelů (bez hashů)
 */
router.get("/", async (_req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "role", "active", "createdAt", "updatedAt"],
      order: [["id", "ASC"]],
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /users
 * Vytvoření uživatele
 * Body: { username, password, role, active? }
 */
router.post(
  "/",
  body("username").isString().trim().notEmpty(),
  body("password").isString().isLength({ min: 4 }),
  body("role").isIn(["admin", "operator", "worker"]),
  body("active").optional().isBoolean(),
  validate,
  async (req, res, next) => {
    try {
      const { username, password, role, active = true } = req.body;

      const exists = await User.findOne({ where: { username } });
      if (exists) {
        return res.status(409).json({ error: { code: "CONFLICT", message: "Username already exists" } });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, passwordHash, role, active });

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * PATCH /users/:id
 * Úprava role/aktivace/hesla
 * Body: { role?, active?, password? }
 */
router.patch(
  "/:id",
  param("id").isInt(),
  body("role").optional().isIn(["admin", "operator", "worker"]),
  body("active").optional().isBoolean(),
  body("password").optional().isString().isLength({ min: 4 }),
  validate,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });

      const { role, active, password } = req.body;

      if (role !== undefined) user.role = role;
      if (active !== undefined) user.active = active;
      if (password) user.passwordHash = await bcrypt.hash(password, 10);

      await user.save();

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * DELETE /users/:id
 * Místo fyzického smazání jen deaktivujeme (active=false)
 */
router.delete(
  "/:id",
  param("id").isInt(),
  validate,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });

      user.active = false;
      await user.save();

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
