// File: apps/backend/src/models/Database.js
import 'dotenv/config';
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  {
    logging: false,
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    },
  }
);
