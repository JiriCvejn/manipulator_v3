import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

class LayoutCell extends Model {}

LayoutCell.init(
  {
    id:         { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    layoutId:   { type: DataTypes.BIGINT, allowNull: false, field: "layout_id" },
    row:        { type: DataTypes.INTEGER, allowNull: false, field: "row" },
    col:        { type: DataTypes.INTEGER, allowNull: false, field: "col" },
    active:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "active" },
    storageCode:{ type: DataTypes.STRING(5), allowNull: true, field: "storage_code" },
    label:      { type: DataTypes.CHAR(1), allowNull: true, field: "label" },
  },
  {
    sequelize,
    modelName: "LayoutCell",
    tableName: "layout_cells",
    underscored: true,
    freezeTableName: true,
    // POZOR: indexy musí používat NÁZVY SLOUPCŮ (snake_case)
    indexes: [
      { name: "layout_cells_layout_id",   fields: ["layout_id"] },
      { name: "layout_cells_storage_code",fields: ["storage_code"] },
      { name: "layout_cell_layout_storage_unique", unique: true, fields: ["layout_id", "storage_code"] },
    ],
  }
);

export default LayoutCell;
