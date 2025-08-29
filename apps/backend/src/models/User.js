// File: apps/backend/src/models/User.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";
import bcrypt from "bcryptjs";

class User extends Model {
  async checkPassword(plain) {
    return bcrypt.compare(plain, this.passwordHash);
  }
}

User.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: "username" },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false, field: "password_hash" },
    role: { type: DataTypes.ENUM("admin", "operator", "worker"), allowNull: false, field: "role" },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "active" },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    underscored: true,
    freezeTableName: true,
    indexes: [{ unique: true, fields: ["username"] }],
  }
);

export default User;
