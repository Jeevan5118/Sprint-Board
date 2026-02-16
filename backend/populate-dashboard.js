const db = require('./src/config/database');

async function populateDashboard() {
    try {
        console.log('--- REPOPULATING DASHBOARD DATA ---');

        // 1. Get IDs of new accounts
        const [users] = await db.query('SELECT id, email FROM users WHERE email IN ("admin1@mail.com", "member1@mail.com", "member2@mail.com", "member3@mail.com", "member6@mail.com")');
        const userMap = {};
        users.forEach(u => userMap[u.email] = u.id);

        console.log('User Mapping:', userMap);

        if (!userMap['admin1@mail.com']) {
            console.error('Error: admin1@mail.com not found!');
            process.exit(1);
        }

        // 2. Get all existing tasks
        const [tasks] = await db.query('SELECT id FROM tasks');
        if (tasks.length === 0) {
            console.log('No tasks found. Creating dummy tasks...');
            // Optional: Create tasks if none exist, but usually there are some from seeding
        }

        // 3. Reassign tasks and randomize statuses
        const statuses = ['todo', 'in_progress', 'done', 'in_review'];
        const assignments = [
            userMap['admin1@mail.com'],
            userMap['member1@mail.com'],
            userMap['member2@mail.com'],
            userMap['member3@mail.com'],
            userMap['member6@mail.com']
        ].filter(id => id); // filter out undefined if some members missing

        for (let i = 0; i < tasks.length; i++) {
            const taskId = tasks[i].id;
            const status = statuses[i % statuses.length];
            const userId = assignments[i % assignments.length];

            await db.execute(
                'UPDATE tasks SET assigned_to = ?, status = ? WHERE id = ?',
                [userId, status, taskId]
            );
            console.log(`Task ${taskId} -> User ${userId} (${status})`);
        }

        console.log('\nDashboard data updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

populateDashboard();
