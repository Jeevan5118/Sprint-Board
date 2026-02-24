const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      version VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getExecutedVersions() {
  const [rows] = await db.query('SELECT version FROM schema_migrations');
  return new Set(rows.map((r) => r.version));
}

async function executeMigration(filePath, version) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(sql);
    await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [version]);
    await conn.commit();
    console.log(`Applied migration: ${version}`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function main() {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    return;
  }

  await ensureMigrationsTable();
  const executed = await getExecutedVersions();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`Skipping migration (already applied): ${file}`);
      continue;
    }
    const filePath = path.join(migrationsDir, file);
    await executeMigration(filePath, file);
  }

  console.log('Migration run complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
