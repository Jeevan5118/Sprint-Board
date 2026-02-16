const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function fixMembers() {
    try {
        const hash = await bcrypt.hash('password123', 10);
        console.log('Using hash for "password123"');

        // IDs verified as 1 and 2
        const alpha = 1;
        const beta = 2;

        console.log('--- RESETTING TEAM MEMBERS ---');
        await db.execute('DELETE FROM team_members');

        for (let i = 1; i <= 10; i++) {
            const email = `member${i}@mail.com`;
            const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

            let userId;
            if (users.length === 0) {
                const [res] = await db.execute(
                    'INSERT INTO users (email, password, role, first_name, last_name, is_active) VALUES (?, ?, "member", "Member", ?, TRUE)',
                    [email, hash, i]
                );
                userId = res.insertId;
                console.log(`Created user: ${email}`);
            } else {
                userId = users[0].id;
                console.log(`Using existing user: ${email}`);
            }

            const teamId = i <= 5 ? alpha : beta;
            await db.execute('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [teamId, userId]);
            console.log(`Assigned ${email} to Team ${teamId}`);
        }

        const [finalCount] = await db.execute('SELECT COUNT(*) as count FROM team_members');
        console.log(`\nFinal Team Membership Count: ${finalCount[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        process.exit(1);
    }
}

fixMembers();
