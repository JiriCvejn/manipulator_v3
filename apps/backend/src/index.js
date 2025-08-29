import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { sequelize } from "./models/Database.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import storagesRouter from "./routes/storages.js";
import routesRouter from "./routes/routes.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- CORS ---------- */
// Pokud není nastavena proměnná CORS_ORIGIN, povolíme všechny originy (vývoj).
// Jinak očekáváme seznam originů oddělený čárkou.
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : undefined;

const corsOptions = {
  origin: ALLOWED_ORIGINS || true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

// CORS + preflight
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
/* -------------------------- */

app.use(express.json());
app.use(morgan("dev"));

// Healthcheck (bez tokenu)
app.get("/health", (_req, res) => res.send("OK"));

// Public auth
app.use("/", authRouter);

// Chráněné sekce
app.use("/storages", storagesRouter);
app.use("/routes", routesRouter);
app.use("/users", usersRouter);

// 404 pro neexistující API endpointy
app.use((req, _res, next) => {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});

// Error handler
app.use(errorHandler);

// Start serveru + ověření DB připojení
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  }
})();
