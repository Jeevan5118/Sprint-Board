const API = 'http://127.0.0.1:5001/api';

async function req(path, method = 'GET', body = null, token = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    return await res.json();
}

async function debug() {
    // Login as admin
    const login = await req('/auth/login', 'POST', { email: 'admin@scrumboard.com', password: 'admin123' });
    const adminToken = login.data.token;
    console.log('Admin logged in');

    // Get all teams with members
    const teams = await req('/teams', 'GET', null, adminToken);
    console.log('\n=== TEAMS ===');
    const teamList = teams.data?.teams || teams.data || [];
    for (const team of teamList) {
        console.log(`\nTeam: "${team.name}" (ID: ${team.id})`);
        // Get team details with members
        const details = await req(`/teams/${team.id}`, 'GET', null, adminToken);
        const members = details.data?.team?.members || details.data?.members || [];
        console.log(`  Members (${members.length}):`);
        for (const m of members) {
            console.log(`    - ${m.first_name} ${m.last_name} (${m.email}, role: ${m.role}, user_id: ${m.id || m.user_id})`);
        }
    }

    // Get all projects
    const projects = await req('/projects', 'GET', null, adminToken);
    console.log('\n=== PROJECTS ===');
    const projList = projects.data?.projects || projects.data || [];
    for (const p of projList) {
        console.log(`  Project: "${p.name}" (ID: ${p.id}, team_id: ${p.team_id})`);
    }

    // Try to find member accounts
    console.log('\n=== MEMBER LOGIN ATTEMPTS ===');
    const memberEmails = ['member@scrumboard.com', 'john@scrumboard.com', 'jane@scrumboard.com'];
    for (const email of memberEmails) {
        for (const pw of ['password123', 'member123', 'admin123']) {
            const r = await req('/auth/login', 'POST', { email, password: pw });
            if (r.data?.token) {
                console.log(`  ✅ ${email} / ${pw} → user_id: ${r.data.user?.id}, role: ${r.data.user?.role}`);

                // Check what this user sees
                const projs = await req('/projects', 'GET', null, r.data.token);
                const pList = projs.data?.projects || projs.data || [];
                console.log(`     Sees ${pList.length} projects`);

                const dash = await req('/dashboard/user', 'GET', null, r.data.token);
                console.log(`     Dashboard: ${JSON.stringify(dash.data?.stats)}`);
                break;
            }
        }
    }
}

debug().catch(e => console.error(e));
