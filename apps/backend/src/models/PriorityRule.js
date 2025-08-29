import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

class PriorityRule extends Model {}

PriorityRule.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    scope: { type: DataTypes.ENUM("route"), allowNull: false, defaultValue: "route", field: "scope" },
    fromCode: { type: DataTypes.STRING(5), allowNull: false, field: "from_code" },
    toCode:   { type: DataTypes.STRING(5), allowNull: false, field: "to_code" },
    defaultUrgency: { type: DataTypes.ENUM("STANDARD","URGENT"), allowNull: false, field: "default_urgency" },
    enabled:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "enabled" },
  },
  {
    sequelize,
    modelName: "PriorityRule",
    tableName: "priority_rules",
    underscored: true,
    freezeTableName: true,
    indexes: [
      { unique: true, fields: ["scope","from_code","to_code"], name: "priority_scope_from_to_unique" },
    ],
  }
);

export default PriorityRule;
