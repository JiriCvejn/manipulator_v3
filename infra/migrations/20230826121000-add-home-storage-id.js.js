const { Client } = require('pg');

const DEFAULT_URL = 'postgres://postgres:Verbatim5@localhost:5432/postgres';

const SQL_UP = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS home_storage_id BIGINT NULL REFERENCES storages(id);`,
  `DO $$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'home_storage_code'
     ) THEN
       UPDATE users u
       SET home_storage_id = s.id
       FROM storages s
       WHERE u.home_storage_code = s.code;

       ALTER TABLE users DROP COLUMN home_storage_code;
     END IF;
   END $$;`
];

const SQL_DOWN = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS home_storage_code VARCHAR(5);`,
  `UPDATE users u SET home_storage_code = s.code FROM storages s WHERE u.home_storage_id = s.id;`,
  `ALTER TABLE users DROP COLUMN home_storage_id;`
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