
const express = require('express');
const app = express();
const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

// Database Configuration
const config = require('./src/config/env');

async function seedData() {
    console.log('🌱 Starting Seed Data Script...');

    try {
        // 1. Get the first user (likely the one you just logged in as)
        const [users] = await db.execute('SELECT * FROM users LIMIT 1');
        if (users.length === 0) {
            console.log('❌ No users found. Please register first.');
            process.exit(1);
        }
        const user = users[0];
        console.log(`👤 Found User: ${user.email} (ID: ${user.id})`);

        // 2. Create a default Team (if not exists)
        const [teams] = await db.execute('SELECT * FROM teams WHERE name = ?', ['Demo Team']);
        let teamId;
        if (teams.length > 0) {
            teamId = teams[0].id;
            console.log(`✅ Default Team "Demo Team" already exists (ID: ${teamId})`);
        } else {
            const [res] = await db.execute('INSERT INTO teams (name, description) VALUES (?, ?)', ['Demo Team', 'A demo team for new users']);
            teamId = res.insertId;
            console.log(`✅ Created Default Team "Demo Team" (ID: ${teamId})`);
        }

        // 3. Add User to Team (if not already member)
        const [members] = await db.execute('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, user.id]);
        if (members.length === 0) {
            await db.execute('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [teamId, user.id]);
            console.log(`✅ Added User to Team`);
        } else {
            console.log(`✅ User is already in Team`);
        }

        // 4. Create a Default Project (if not exists)
        const [projects] = await db.execute('SELECT * FROM projects WHERE key_code = ?', ['DEMO']);
        let projectId;
        if (projects.length > 0) {
            projectId = projects[0].id;
            console.log(`✅ Default Project "Demo Project" already exists (ID: ${projectId})`);
        } else {
            const [res] = await db.execute(
                'INSERT INTO projects (name, key_code, description, team_id, created_by, start_date, end_date) VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))',
                ['Demo Project', 'DEMO', 'Your first demo project', teamId, user.id]
            );
            projectId = res.insertId;
            console.log(`✅ Created Default Project "Demo Project" (ID: ${projectId})`);
        }

        // 5. Create an Active Sprint (if not exists)
        const [sprints] = await db.execute('SELECT * FROM sprints WHERE project_id = ? AND status = ?', [projectId, 'active']);
        if (sprints.length > 0) {
            console.log(`✅ Active Sprint already exists (ID: ${sprints[0].id})`);
        } else {
            const [res] = await db.execute(
                'INSERT INTO sprints (name, goal, start_date, end_date, status, project_id) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), ?, ?)',
                ['Sprint 1', 'Complete the demo setup', 'active', projectId]
            );
            console.log(`✅ Created Active Sprint "Sprint 1" (ID: ${res.insertId})`);
        }

        console.log('\n🎉 Seed Data Complete! Refresh your browser to see the Sprint Board link active.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed Failed:', error);
        process.exit(1);
    }
}

seedData();
