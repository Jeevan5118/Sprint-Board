const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../src/utils/bcrypt');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`${name} is required`);
  }
  return String(value).trim();
}

async function main() {
  const dbHost = requiredEnv('DB_HOST');
  const dbPort = Number(process.env.DB_PORT || 3306);
  const dbUser = requiredEnv('DB_USER');
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = requiredEnv('DB_NAME');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin1@mail.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const adminFirstName = (process.env.ADMIN_FIRST_NAME || 'Admin').trim();
  const adminLastName = (process.env.ADMIN_LAST_NAME || 'One').trim();

  if (adminPassword.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName
  });

  try {
    const passwordHash = await hashPassword(adminPassword);

    const [existingRows] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [adminEmail]
    );

    if (existingRows.length > 0) {
      const userId = Number(existingRows[0].id);
      await connection.query(
        `UPDATE users
         SET password = ?, first_name = ?, last_name = ?, role = 'admin', is_active = 1
         WHERE id = ?`,
        [passwordHash, adminFirstName, adminLastName, userId]
      );
      console.log(`Updated existing admin user: ${adminEmail} (id=${userId})`);
    } else {
      const [result] = await connection.query(
        `INSERT INTO users (email, password, first_name, last_name, role, is_active)
         VALUES (?, ?, ?, ?, 'admin', 1)`,
        [adminEmail, passwordHash, adminFirstName, adminLastName]
      );
      console.log(`Created admin user: ${adminEmail} (id=${result.insertId})`);
    }
  } finally {
    await connection.end();
  }
}

main()
  .then(() => {
    console.log('ensure-admin completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('ensure-admin failed:', error.message);
    process.exit(1);
  });
