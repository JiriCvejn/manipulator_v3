// File: apps/backend/src/models/Database.js
import 'dotenv/config';
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DATABASE_URL || psql 'postgresql://neondb_owner:npg_ZzmQt4fs7DEp@ep-ancient-block-a9vwo2ii-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  {
    logging: false,
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
    },
  }
);

