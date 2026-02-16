const API = 'http://127.0.0.1:5001/api';

async function req(path, method = 'GET', body = null, token = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    return await res.json();
}

async function test() {
    // Test 1: Login as a seeded member (bob.smith) 
    console.log('=== TEST: Member (bob.smith) Visibility ===');
    let r = await req('/auth/login', 'POST', { email: 'bob.smith@scrumboard.com', password: 'password123' });
    if (!r.data?.token) { console.log('❌ Bob login failed', r); return; }
    const bobToken = r.data.token;
    console.log('✅ Bob logged in (ID: ' + r.data.user.id + ')');

    // What projects does Bob see?
    r = await req('/projects', 'GET', null, bobToken);
    const projects = r.data?.projects || r.data || [];
    console.log(`  Projects: ${projects.length}`);
    for (const p of projects) console.log(`    - ${p.name} (team: ${p.team_id})`);

    // Dashboard
    r = await req('/dashboard/user', 'GET', null, bobToken);
    console.log(`  Dashboard: ${JSON.stringify(r.data?.stats)}`);

    // Sprint board access: try Sprint 3 of E-Commerce Platform
    r = await req('/tasks/sprint/3', 'GET', null, bobToken);
    const tasks = r.data?.tasks || r.data || [];
    console.log(`  Sprint 3 Tasks: ${tasks.length}`);

    // Test 2: Login as a user NOT in any team
    console.log('\n=== TEST: Non-team Member Visibility ===');
    const testEmails = ['member1@mail.com', 'jeevan2002@mail.com'];
    for (const email of testEmails) {
        for (const pw of ['password123', 'admin123', 'member123', 'test123']) {
            r = await req('/auth/login', 'POST', { email, password: pw });
            if (r.data?.token) {
                console.log(`✅ ${email} logged in with ${pw}`);
                const token = r.data.token;
                r = await req('/projects', 'GET', null, token);
                const p = r.data?.projects || r.data || [];
                console.log(`  Projects: ${p.length} (should be 0 if not in team)`);
                r = await req('/dashboard/user', 'GET', null, token);
                console.log(`  Dashboard: ${JSON.stringify(r.data?.stats)}`);
                break;
            }
        }
    }
}

test().catch(e => console.error(e));
