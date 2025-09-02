import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL!;
export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,            // Neon vyžaduje SSL
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,                     // u serverless stačí menší pool
    min: 0,
    acquire: 20000,
    idle: 10000
  },
  logging: false
});
