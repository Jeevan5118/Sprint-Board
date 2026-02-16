const db = require('./src/config/database');
const { hashPassword } = require('./src/utils/bcrypt');

async function updateAdminPassword() {
  try {
    console.log('Updating admin password...\n');

    const newPassword = 'admin123';
    const hashedPassword = await hashPassword(newPassword);

    await db.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@scrumboard.com']
    );

    console.log('✓ Admin password updated successfully!');
    console.log('✓ Email: admin@scrumboard.com');
    console.log('✓ Password: admin123');
    console.log('\nYou can now login with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

updateAdminPassword();
