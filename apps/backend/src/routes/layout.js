import express from "express";
import Layout from "../models/Layout.js";
import LayoutCell from "../models/LayoutCell.js";
import Storage from "../models/Storage.js";
import AuditLog from "../models/AuditLog.js";
const router = express.Router();

// Get layout (assuming single layout configuration for now)
router.get("/", async (_req, res, next) => {
  try {
    // Get the latest layout (for simplicity, take first or id=1)
    const layout = await Layout.findOne();
    if (!layout) return res.json(null);
    const cells = await LayoutCell.findAll({ where: { layoutId: layout.id } });
    // Build grid structure 12x12
    const grid = Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => ({ active: false })));
    for (const cell of cells) {
      if (cell.active) {
        grid[cell.row][cell.col] = { active: true, storageCode: cell.storageCode, label: cell.label };
      }
    }
    // Also include layers if needed (not stored separately here, could add static or from DB if extended)
    const layers = []; // placeholder for visual layer data if any
    res.json({ layers, grid });
  } catch (err) { next(err); }
});

// Save layout (replace all cells config)
router.post("/", async (req, res, next) => {
  const { grid } = req.body;
  if (!grid || !Array.isArray(grid) || grid.length !== 12) {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Grid (12x12) data is required" } });
  }
  try {
    // Use a single layout record
    let layout = await Layout.findOne();
    if (!layout) {
      layout = await Layout.create({ name: "Main Layout" });
    }
    // Validate no duplicate storage codes and all active storages exist
    const usedCodes = new Set();
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        const cell = grid[i][j];
        if (cell.active) {
          if (!cell.storageCode) throw { status: 422, code: "INVALID_INPUT", message: `Slot (${i},${j}) aktivní bez kódu úložiště` };
          if (usedCodes.has(cell.storageCode)) throw { status: 422, code: "DUPLICATE_STORAGE", message: `Duplicitní úložiště ${cell.storageCode} v layoutu` };
          usedCodes.add(cell.storageCode);
          const storageExists = await Storage.findOne({ where: { code: cell.storageCode } });
          if (!storageExists) throw { status: 422, code: "INVALID_STORAGE", message: `Úložiště ${cell.storageCode} neexistuje` };
        }
      }
    }
    // Delete old cells and insert new ones
    await LayoutCell.destroy({ where: { layoutId: layout.id } });
    const cellsToCreate = [];
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        const cell = grid[i][j];
        if (cell.active) {
          cellsToCreate.push({ layoutId: layout.id, row: i, col: j, active: true, storageCode: cell.storageCode, label: cell.label || cell.storageCode.charAt(0) });
        }
      }
    }
    if (cellsToCreate.length) {
      await LayoutCell.bulkCreate(cellsToCreate);
    }
    await AuditLog.create({ actorId: req.user.id, action: "LAYOUT_SAVED", entityType: "LAYOUT", entityId: String(layout.id), meta: {} });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
