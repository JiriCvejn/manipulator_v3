import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

class Layout extends Model {}

Layout.init(
  {
    id:   { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(50), allowNull: false, field: "name" },
  },
  {
    sequelize,
    modelName: "Layout",
    tableName: "layouts",
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  }
);

export default Layout;
