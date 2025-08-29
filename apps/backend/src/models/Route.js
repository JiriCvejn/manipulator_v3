import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

class Route extends Model {}

Route.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    fromCode: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: "from_code",
    },
    toCode: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: "to_code",
    },
  },
  {
    sequelize,
    modelName: "Route",
    tableName: "routes",
    underscored: true,     // => created_at / updated_at
    freezeTableName: true,
    timestamps: true,      // ZAPNUTO – Sequelize bude posílat createdAt/updatedAt
    indexes: [
      { unique: true, fields: ["from_code", "to_code"], name: "route_from_code_to_code" },
    ],
  }
);

export default Route;
