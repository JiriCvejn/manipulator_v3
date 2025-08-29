import express from "express";
import cors from "cors";
import morgan from "morgan";
import { sequelize } from "./models/Database.js";

import authRouter from "./routes/auth.js";
import storagesRouter from "./routes/storages.js";
import routesRouter from "./routes/routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ----- CORS: výslovně povol FE na 5173 -----
const ALLOW_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: ALLOW_ORIGIN,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false
}));
// preflight
app.options("*", cors({
  origin: ALLOW_ORIGIN,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false
}));
// --------------------------------------------

app.use(express.json());
app.use(morgan("dev"));

// Healthcheck (bez tokenu)
app.get("/health", (_req, res) => res.send("OK"));

// Public auth
app.use("/", authRouter);

// Chráněné sekce
app.use("/storages", storagesRouter);
app.use("/routes", routesRouter);

// 404 pro API
app.use((req, res, next) => {
  return res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
});

app.use(errorHandler);

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log(`Manipulator_BE běží na portu ${PORT}`);
  } catch (e) {
    console.error("DB connection failed:", e);
  }
});
