const db = require('./src/config/database');

async function debugData() {
    try {
        console.log('--- Teams ---');
        const [teams] = await db.query('SELECT id, name FROM teams');
        console.table(teams);

        console.log('\n--- Team Members ---');
        const [members] = await db.query('SELECT * FROM team_members');
        console.table(members);

        console.log('\n--- Users (First 15) ---');
        const [users] = await db.query('SELECT id, email, first_name, last_name FROM users LIMIT 15');
        console.table(users);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugData();
