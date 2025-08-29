import express from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validate from "../middleware/validate.js";
import errorWrap from "../utils/errorWrap.js";
import User from "../models/User.js";

const router = express.Router();

// společný handler pro POST /login i /auth/login
const handleLogin = errorWrap(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
  }

  const token = jwt.sign(
    { id: String(user.id), username: user.username, role: user.role },
    process.env.JWT_SECRET || "devsecret",
    { expiresIn: "12h" }
  );

  res.json({
    token,
    user: { id: String(user.id), username: user.username, role: user.role }
  });
});

const validators = [
  body("username").isString().trim().notEmpty(),
  body("password").isString().trim().notEmpty(),
  validate,
];

// dvě cesty vedoucí na stejnou logiku (pro jistotu kompatibility FE)
router.post("/login", validators, handleLogin);
router.post("/auth/login", validators, handleLogin);

export default router;

