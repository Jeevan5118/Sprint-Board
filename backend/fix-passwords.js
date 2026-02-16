const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
    try {
        // Generate a real bcrypt hash for "password123"
        const hash = await bcrypt.hash('password123', 10);
        console.log('Generated hash for "password123":', hash);

        // Update ALL users whose password is the fake seed hash
        const fakeHash = '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H';

        const [result] = await db.execute(
            'UPDATE users SET password = ? WHERE password = ?',
            [hash, fakeHash]
        );
        console.log(`Updated ${result.affectedRows} users with valid password.`);

        // Verify: try logging in as bob
        const [users] = await db.execute('SELECT id, email, role, password FROM users WHERE email = ?', ['bob.smith@scrumboard.com']);
        if (users.length > 0) {
            const match = await bcrypt.compare('password123', users[0].password);
            console.log(`Bob Smith login test: ${match ? '✅ PASS' : '❌ FAIL'}`);
        }

        // List all users and their roles
        const [allUsers] = await db.execute('SELECT id, email, role FROM users ORDER BY id');
        console.log('\n=== ALL USERS ===');
        for (const u of allUsers) {
            console.log(`  ID: ${u.id} | ${u.email} | role: ${u.role}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixPasswords();
