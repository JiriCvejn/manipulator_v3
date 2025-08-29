// File: infra/migrations/20230826120000-init.js
// Node migration skript pro PostgreSQL (UP/DOWN).
// Použití z kořene projektu:
//   UP:   node infra/migrations/20230826120000-init.js up
//   DOWN: node infra/migrations/20230826120000-init.js down
// Pokud není nastaveno DATABASE_URL, použije se localhost.
const { Client } = require('pg');

const DEFAULT_URL = 'postgres://postgres:postgres@localhost:5432/postgres';

const SQL_UP = [
  // --- ENUM typy ---
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin','operator','worker');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('new','in_progress','done','canceled');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency') THEN
        CREATE TYPE urgency AS ENUM ('STANDARD','URGENT');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_scope') THEN
        CREATE TYPE priority_scope AS ENUM ('route');
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM (
          'USER_ACTIVATED','USER_DEACTIVATED','USER_RESET_PASSWORD',
          'ORDER_CREATED','ORDER_TAKEN','ORDER_DONE','ORDER_CANCELED',
          'ROUTES_BULK_UPDATE','PRIORITY_RULE_UPSERT','LAYOUT_SAVED'
        );
      END IF;
    END $$;`,
  `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_entity_type') THEN
        CREATE TYPE audit_entity_type AS ENUM ('USER','ORDER','ROUTE','PRIORITY_RULE','LAYOUT');
      END IF;
    END $$;`,

  // --- Tabulky ---
  `CREATE TABLE IF NOT EXISTS storages (
     id    BIGSERIAL PRIMARY KEY,
     code  VARCHAR(5)  NOT NULL UNIQUE,
     name  VARCHAR(100) NOT NULL
   );`,

  `CREATE TABLE IF NOT EXISTS routes (
     id         BIGSERIAL PRIMARY KEY,
     from_code  VARCHAR(5) NOT NULL REFERENCES storages(code),
     to_code    VARCHAR(5) NOT NULL REFERENCES storages(code),
     active     BOOLEAN NOT NULL DEFAULT TRUE,
     UNIQUE (from_code, to_code)
   );`,
  `CREATE INDEX IF NOT EXISTS idx_routes_from_code ON routes(from_code);`,
  `CREATE INDEX IF NOT EXISTS idx_routes_to_code   ON routes(to_code);`,

  `CREATE TABLE IF NOT EXISTS priority_rules (
     id               BIGSERIAL PRIMARY KEY,
     scope            priority_scope NOT NULL DEFAULT 'route',
     from_code        VARCHAR(5) NOT NULL REFERENCES storages(code),
     to_code          VARCHAR(5) NOT NULL REFERENCES storages(code),
     default_urgency  urgency NOT NULL,
     enabled          BOOLEAN NOT NULL DEFAULT TRUE,
     UNIQUE (scope, from_code, to_code)
   );`,

  `CREATE TABLE IF NOT EXISTS users (
     id                 BIGSERIAL PRIMARY KEY,
     username           VARCHAR(50)  NOT NULL UNIQUE,
     password_hash      VARCHAR(100) NOT NULL,
     role               user_role    NOT NULL,
     active             BOOLEAN      NOT NULL DEFAULT TRUE,
     home_storage_code  VARCHAR(5) NULL REFERENCES storages(code)
   );`,

  `CREATE TABLE IF NOT EXISTS orders (
     id           BIGSERIAL PRIMARY KEY,
     from_code    VARCHAR(5) NOT NULL REFERENCES storages(code),
     to_code      VARCHAR(5) NOT NULL REFERENCES storages(code),
     urgency      urgency    NOT NULL,
     note         TEXT NULL,
     status       order_status NOT NULL DEFAULT 'new',
     assignee_id  BIGINT NULL REFERENCES users(id),
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     taken_at     TIMESTAMPTZ NULL,
     done_at      TIMESTAMPTZ NULL,
     canceled_at  TIMESTAMPTZ NULL
   );`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);`,
  `CREATE INDEX IF NOT EXISTS idx_orders_from_code        ON orders(from_code);`,
  `CREATE INDEX IF NOT EXISTS idx_orders_from_status      ON orders(from_code, status);`,
  `CREATE INDEX IF NOT EXISTS idx_orders_urgency_status   ON orders(urgency, status);`,

  `CREATE TABLE IF NOT EXISTS layouts (
     id    BIGSERIAL PRIMARY KEY,
     name  VARCHAR(50) NOT NULL
   );`,

  `CREATE TABLE IF NOT EXISTS layout_cells (
     id            BIGSERIAL PRIMARY KEY,
     layout_id     BIGINT NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
     row           INTEGER NOT NULL,
     col           INTEGER NOT NULL,
     active        BOOLEAN NOT NULL DEFAULT FALSE,
     storage_code  VARCHAR(5) NULL REFERENCES storages(code),
     label         CHAR(1) NULL,
     UNIQUE (layout_id, storage_code)
   );`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
     id           BIGSERIAL PRIMARY KEY,
     ts           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     actor_id     BIGINT NULL,
     action       audit_action NOT NULL,
     entity_type  audit_entity_type NOT NULL,
     entity_id    TEXT NULL,
     meta         JSONB NULL
   );`,
  `CREATE INDEX IF NOT EXISTS idx_audit_ts                ON audit_logs(ts);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_entity           ON audit_logs(entity_type, entity_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_action           ON audit_logs(action);`
];

const SQL_DOWN = [
  `DROP TABLE IF EXISTS audit_logs;`,
  `DROP TABLE IF EXISTS layout_cells;`,
  `DROP TABLE IF EXISTS layouts;`,
  `DROP TABLE IF EXISTS orders;`,
  `DROP TABLE IF EXISTS users;`,
  `DROP TABLE IF EXISTS priority_rules;`,
  `DROP TABLE IF EXISTS routes;`,
  `DROP TABLE IF EXISTS storages;`,
  `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname='audit_entity_type') THEN DROP TYPE audit_entity_type; END IF; END $$;`,
  `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname='audit_action') THEN DROP TYPE audit_action; END IF; END $$;`,
  `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname='priority_scope') THEN DROP TYPE priority_scope; END IF; END $$;`,
  `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname='urgency') THEN DROP TYPE urgency; END IF; END $$;`,
  `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname='order_status') THEN DROP TYPE order_status; END IF; END $$;`,
  `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname='user_role') THEN DROP TYPE user_role; END IF; END $$;`
];

async function run(queries) {
  const client = new Client({ connectionString: process.env.DATABASE_URL || DEFAULT_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    for (const q of queries) {
      await client.query(q);
    }
    await client.query('COMMIT');
    console.log('OK');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function up() { await run(SQL_UP); }
async function down() { await run(SQL_DOWN); }

if (require.main === module) {
  const dir = (process.argv[2] || 'up').toLowerCase();
  if (dir === 'down') down(); else up();
}

module.exports = { up, down };
