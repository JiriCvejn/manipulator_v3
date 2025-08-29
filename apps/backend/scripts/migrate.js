// File: apps/backend/scripts/migrate.js
import { sequelize } from "../src/models/Database.js";
import "../src/models/initModels.js";

async function migrate() {
  try {
    await sequelize.sync({ alter: false });
    console.log("Database schema is up-to-date");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}
migrate();
