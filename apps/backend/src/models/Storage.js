import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

class Storage extends Model {}

Storage.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(5), allowNull: false, unique: true },          // dle DB máš VARCHAR(5)
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "STORAGE" }, // sjednoceno s DB
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: "Storage",
    tableName: "storages",
    underscored: true,
    freezeTableName: true,
    indexes: [{ unique: true, fields: ["code"] }],
  }
);

export default Storage;
