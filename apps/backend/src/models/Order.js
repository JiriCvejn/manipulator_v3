import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

class Order extends Model {}

Order.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    fromCode:  { type: DataTypes.STRING(5), allowNull: false, field: "from_code" },
    toCode:    { type: DataTypes.STRING(5), allowNull: false, field: "to_code" },
    urgency:   { type: DataTypes.ENUM("STANDARD","URGENT"), allowNull: false, field: "urgency" },
    note:      { type: DataTypes.TEXT, allowNull: true, field: "note" },
    status:    { type: DataTypes.ENUM("new","in_progress","done","canceled"), allowNull: false, defaultValue: "new", field: "status" },
    assigneeId:{ type: DataTypes.BIGINT, allowNull: true, field: "assignee_id" },
    createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
    takenAt:   { type: DataTypes.DATE, allowNull: true, field: "taken_at" },
    doneAt:    { type: DataTypes.DATE, allowNull: true, field: "done_at" },
    canceledAt:{ type: DataTypes.DATE, allowNull: true, field: "canceled_at" },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ["status"] },
      { fields: ["from_code"] },
      { fields: ["from_code","status"] },
      { fields: ["urgency","status"] },
    ],
  }
);

export default Order;
