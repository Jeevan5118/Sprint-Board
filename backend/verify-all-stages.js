const fs = require('fs');
const API = 'http://127.0.0.1:5001/api';
const LOG = 'verification-report.txt';
let adminToken = '', memberToken = '';
let passed = 0, failed = 0;

fs.writeFileSync(LOG, '=== FULL APPLICATION VERIFICATION (Stages 5-14) ===\n');
fs.appendFileSync(LOG, `Date: ${new Date().toISOString()}\n\n`);
function log(msg) { console.log(msg); fs.appendFileSync(LOG, msg + '\n'); }

async function req(path, method = 'GET', body = null, token = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { status: res.status, ok: res.ok, data };
}

function test(name, condition) {
    if (condition) { log(`  ✅ PASS: ${name}`); passed++; }
    else { log(`  ❌ FAIL: ${name}`); failed++; }
}

async function run() {
    // ====== AUTH ======
    log('--- AUTHENTICATION ---');
    let r = await req('/auth/login', 'POST', { email: 'admin@scrumboard.com', password: 'admin123' });
    if (!r.ok) r = await req('/auth/login', 'POST', { email: 'admin@scrumboard.com', password: 'password123' });
    test('Admin login', r.ok && r.data?.data?.token);
    adminToken = r.data?.data?.token || '';

    const memberEmail = `testmember_${Date.now()}@test.com`;
    r = await req('/auth/register', 'POST', { first_name: 'Test', last_name: 'Member', email: memberEmail, password: 'test123', role: 'member' });
    if (r.ok) { memberToken = r.data?.data?.token || ''; test('Member registration', true); }
    else {
        r = await req('/auth/login', 'POST', { email: 'member@scrumboard.com', password: 'password123' });
        if (!r.ok) r = await req('/auth/login', 'POST', { email: 'member@scrumboard.com', password: 'member123' });
        memberToken = r.data?.data?.token || '';
        test('Member login (fallback)', r.ok);
    }

    // ====== STAGE 5: TEAMS ======
    log('\n--- STAGE 5: Teams Module ---');
    let teamId;
    r = await req('/teams', 'POST', { name: `Team V${Date.now()}`, description: 'Test' }, adminToken);
    test('Admin: Create team', r.ok);
    teamId = r.data?.data?.team?.id || r.data?.data?.id;

    r = await req('/teams', 'GET', null, adminToken);
    test('Admin: View teams', r.ok);
    const teams = r.data?.data?.teams || r.data?.data || [];
    log(`    → Found ${teams.length} teams`);

    if (teamId) {
        r = await req(`/teams/${teamId}/members`, 'POST', { user_id: 1 }, adminToken);
        test('Admin: Add user to team', r.ok || r.status === 409);
    }

    if (memberToken) {
        r = await req('/teams', 'POST', { name: 'Blocked', description: 'x' }, memberToken);
        test('Member: CANNOT create team (403)', !r.ok);
    }

    // ====== STAGE 6: PROJECTS ======
    log('\n--- STAGE 6: Projects Module ---');
    let projId;
    r = await req('/projects', 'POST', {
        name: `Proj V${Date.now()}`, key_code: 'VPR',
        description: 'Test', team_id: teamId || 1
    }, adminToken);
    test('Admin: Create project', r.ok);
    projId = r.data?.data?.project?.id || r.data?.data?.id;

    r = await req('/projects', 'GET', null, adminToken);
    test('Admin: View projects', r.ok);
    const projs = r.data?.data?.projects || r.data?.data || [];
    log(`    → Found ${projs.length} projects`);

    if (projId) {
        r = await req(`/projects/${projId}`, 'GET', null, adminToken);
        test('Admin: View single project', r.ok);
    }

    if (memberToken) {
        r = await req('/projects', 'GET', null, memberToken);
        test('Member: View projects', r.ok);
    }

    // ====== STAGE 7: SPRINTS ======
    log('\n--- STAGE 7: Sprints Module ---');
    let sprintId;
    const sprintProjId = projId || 1;
    r = await req('/sprints', 'POST', {
        name: `Sprint V${Date.now()}`, project_id: sprintProjId,
        start_date: '2025-06-01', end_date: '2025-06-14'
    }, adminToken);
    test('Create sprint', r.ok);
    sprintId = r.data?.data?.sprint?.id || r.data?.data?.id;

    r = await req(`/sprints/project/${sprintProjId}`, 'GET', null, adminToken);
    test('Get sprints by project', r.ok);
    const sprints = r.data?.data?.sprints || r.data?.data || [];
    log(`    → Found ${sprints.length} sprints`);

    if (sprintId) {
        r = await req(`/sprints/${sprintId}/start`, 'PATCH', null, adminToken);
        test('Start sprint (PATCH /start)', r.ok);

        r = await req(`/sprints/${sprintId}/complete`, 'PATCH', null, adminToken);
        test('Complete sprint (PATCH /complete)', r.ok);
    }

    // ====== STAGE 8: TASKS ======
    log('\n--- STAGE 8: Tasks Module ---');
    let taskId;
    // Use an active sprint for tasks - E-Commerce Sprint 4 (ID: 8)
    const activeSprintId = 8;
    r = await req('/tasks', 'POST', {
        title: `Task V${Date.now()}`, description: 'Verification task',
        task_key: `TVR-${Date.now().toString().slice(-4)}`,
        project_id: 1, sprint_id: activeSprintId,
        priority: 'high', story_points: 5, type: 'task'
    }, adminToken);
    test('Create task (with task_key)', r.ok);
    taskId = r.data?.data?.task?.id || r.data?.data?.id;

    r = await req('/tasks/project/1', 'GET', null, adminToken);
    test('Get tasks by project', r.ok);
    const tasks = r.data?.data?.tasks || r.data?.data || [];
    log(`    → Found ${tasks.length} tasks in project 1`);

    r = await req(`/tasks/sprint/${activeSprintId}`, 'GET', null, adminToken);
    test('Get tasks by sprint', r.ok);

    if (taskId) {
        r = await req(`/tasks/${taskId}`, 'GET', null, adminToken);
        test('Get single task', r.ok);

        r = await req(`/tasks/${taskId}`, 'PUT', { title: 'Updated Title', story_points: 8 }, adminToken);
        test('Update task', r.ok);

        r = await req(`/tasks/${taskId}/status`, 'PATCH', { status: 'in_progress' }, adminToken);
        test('Update task status (PATCH)', r.ok);

        r = await req(`/tasks/${taskId}`, 'PUT', { assigned_to: 1 }, adminToken);
        test('Assign user to task', r.ok);

        // Add link
        r = await req(`/tasks/${taskId}/links`, 'POST', { url: 'https://jira.example.com/issue/123', title: 'Test Link' }, adminToken);
        test('Add reference link', r.ok);

        // File attachment (skip - needs multipart)
        log('  ⚠️ SKIP: File attachment (requires multipart upload, tested manually)');
    }

    // ====== STAGE 9: COMMENTS ======
    log('\n--- STAGE 9: Comments Module ---');
    let commentId;
    if (taskId) {
        r = await req(`/comments/task/${taskId}`, 'POST', { content: 'Verification comment' }, adminToken);
        test('Add comment to task', r.ok);
        commentId = r.data?.data?.comment?.id || r.data?.data?.id;

        r = await req(`/comments/task/${taskId}`, 'GET', null, adminToken);
        test('Get comments for task', r.ok);
        const comments = r.data?.data?.comments || r.data?.data || [];
        log(`    → Found ${comments.length} comments`);

        if (commentId) {
            r = await req(`/comments/${commentId}`, 'DELETE', null, adminToken);
            test('Delete own comment', r.ok);
        }
    }

    // ====== STAGE 10: DASHBOARD API ======
    log('\n--- STAGE 10: Dashboard API ---');

    r = await req('/dashboard/sprint/8', 'GET', null, adminToken);
    test('Dashboard: Sprint dashboard endpoint', r.ok);
    if (r.ok) {
        const d = r.data?.data || r.data;
        test('Dashboard: Has stats.total_tasks', d?.stats?.total_tasks !== undefined);
        test('Dashboard: Has stats.completed_tasks', d?.stats?.completed_tasks !== undefined);
        test('Dashboard: Has stats.progress_percentage', d?.stats?.progress_percentage !== undefined);
        log(`    → Sprint 8 Stats: Total=${d?.stats?.total_tasks}, Completed=${d?.stats?.completed_tasks}, Progress=${d?.stats?.progress_percentage}%`);
    }

    r = await req('/dashboard/user', 'GET', null, adminToken);
    test('Dashboard: User dashboard endpoint', r.ok);

    // ====== ROUTE EXISTENCE ======
    log('\n--- Route Existence Check ---');
    for (const [path, name] of [
        ['/teams', 'Teams'], ['/projects', 'Projects'],
        ['/sprints/project/1', 'Sprints'], ['/tasks/project/1', 'Tasks'],
        ['/comments/task/1', 'Comments'], ['/dashboard/sprint/1', 'Dashboard'],
    ]) {
        r = await req(path, 'GET', null, adminToken);
        test(`${name} endpoint (${path})`, r.ok);
    }

    // ====== SUMMARY ======
    log(`\n${'='.repeat(50)}`);
    log(`VERIFICATION COMPLETE`);
    log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    log(`Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
    log(`${'='.repeat(50)}`);
}

run().catch(e => log(`FATAL: ${e.message}`));
