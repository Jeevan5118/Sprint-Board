const fs = require('fs');

// Configuration
const API_URL = 'http://127.0.0.1:5001/api';
const EMAIL = 'admin@scrumboard.com';
const PASSWORD = 'admin123';

async function debugBacklog() {
    const logFile = 'debug-log.txt';
    fs.writeFileSync(logFile, '--- Debugging Backlog Visibility (All Projects) ---\n');
    const log = (msg) => { console.log(msg); fs.appendFileSync(logFile, msg + '\n'); };

    try {
        log('1. Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) {
            const errText = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${errText}`);
        }
        const loginData = await loginRes.json();
        const { token, user } = loginData.data || loginData;
        const headers = { 'Authorization': `Bearer ${token}` };
        log(`   Logged in as: ${user.email}`);

        log('\n2. Fetching Projects...');
        const projRes = await fetch(`${API_URL}/projects`, { headers });
        const { data: { projects } } = await projRes.json();
        log(`   Found ${projects.length} projects.`);

        for (const project of projects) {
            log(`\n==================================================`);
            log(`Project: ${project.name} (ID: ${project.id})`);

            // Get Sprints
            const sprintRes = await fetch(`${API_URL}/sprints/project/${project.id}`, { headers });
            const { data: { sprints } } = await sprintRes.json();
            log(`   Sprints: ${sprints.length}`);

            let activeSprint = sprints.find(s => s.status === 'active');
            if (activeSprint) log(`   Active Sprint: ${activeSprint.name} (ID: ${activeSprint.id})`);

            // Get Tasks
            const taskRes = await fetch(`${API_URL}/tasks/project/${project.id}`, { headers });
            const { data: { tasks } } = await taskRes.json();
            log(`   Tasks: ${tasks.length}`);

            if (tasks.length > 0) {
                log('   Task Distribution:');
                tasks.forEach(t => {
                    let location = 'Unknown';
                    if (t.sprint_id === null) location = 'Backlog (No Sprint)';
                    else if (activeSprint && t.sprint_id === activeSprint.id) location = `Active Sprint (${activeSprint.name})`;
                    else {
                        const s = sprints.find(sp => sp.id === t.sprint_id);
                        location = s ? `Other Sprint: ${s.name} (ID: ${s.id})` : `Unknown Sprint (ID: ${t.sprint_id})`;
                    }
                    log(`     - [${t.task_key}] "${t.title}": SprintID=${t.sprint_id} -> ${location}`);
                });
            }
        }

    } catch (error) {
        log(`Error: ${error.message}`);
    }
}

debugBacklog();
