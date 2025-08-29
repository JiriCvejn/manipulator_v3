import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";


class AuditLog extends Model {}
AuditLog.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  ts: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actorId: { type: DataTypes.BIGINT, allowNull: true },  // null for system actions
  action: { 
    type: DataTypes.ENUM(
      "USER_ACTIVATED","USER_DEACTIVATED","USER_RESET_PASSWORD",
      "ORDER_CREATED","ORDER_TAKEN","ORDER_DONE","ORDER_CANCELED",
      "ROUTES_BULK_UPDATE","PRIORITY_RULE_UPSERT","LAYOUT_SAVED"
    ), allowNull: false 
  },
  entityType: { 
    type: DataTypes.ENUM("USER","ORDER","ROUTE","PRIORITY_RULE","LAYOUT"), 
    allowNull: false 
  },
  entityId: { type: DataTypes.STRING, allowNull: true },
  meta: { type: DataTypes.JSONB, allowNull: true }
}, { 
  sequelize, modelName: "AuditLog",
  indexes: [
    { fields: ["entityType", "entityId"] },
    { fields: ["ts"] },
    { fields: ["action"] }
  ]
});

export default AuditLog;
