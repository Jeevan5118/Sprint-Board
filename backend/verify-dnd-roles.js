const http = require('http');
const app = require('./src/app');
const db = require('./src/config/database');
const { generateToken } = require('./src/utils/jwt');

async function request(base, path, method = 'GET', token, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function nextStatus(current) {
  if (current === 'todo') return 'in_progress';
  return 'todo';
}

async function run() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const results = [];
  const log = (name, pass, detail = '') => results.push({ name, pass, detail });

  try {
    const [taskRows] = await db.query(
      `SELECT t.id, t.status, p.team_id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN sprints s ON s.id = t.sprint_id
       WHERE (s.status IS NULL OR s.status <> 'completed')
       LIMIT 1`
    );
    if (!taskRows[0]) {
      throw new Error('No eligible task found for drag/drop verification');
    }
    const task = taskRows[0];

    const [adminRows] = await db.query(
      `SELECT id, email, role FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`
    );
    if (!adminRows[0]) {
      throw new Error('No admin user found');
    }

    const [leadRows] = await db.query(
      `SELECT u.id, u.email, u.role
       FROM teams t
       JOIN users u ON u.id = t.team_lead_id
       WHERE t.id = ?
       LIMIT 1`,
      [task.team_id]
    );

    const [memberRows] = await db.query(
      `SELECT u.id, u.email, u.role
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = ? AND u.role = 'member'
       ORDER BY u.id
       LIMIT 1`,
      [task.team_id]
    );

    const [outsiderRows] = await db.query(
      `SELECT u.id, u.email, u.role
       FROM users u
       WHERE u.role IN ('member', 'team_lead')
         AND u.id NOT IN (SELECT tm.user_id FROM team_members tm WHERE tm.team_id = ?)
       ORDER BY u.id
       LIMIT 1`,
      [task.team_id]
    );

    const admin = adminRows[0];
    const lead = leadRows[0] || null;
    const member = memberRows[0] || null;
    const outsider = outsiderRows[0] || null;

    const adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
    const leadToken = lead ? generateToken({ id: lead.id, email: lead.email, role: lead.role }) : null;
    const memberToken = member ? generateToken({ id: member.id, email: member.email, role: member.role }) : null;
    const outsiderToken = outsider ? generateToken({ id: outsider.id, email: outsider.email, role: outsider.role }) : null;

    const moveAndVerify = async (name, token, expectedStatusCode) => {
      if (!token) {
        log(`${name} drag/drop`, true, 'skipped (no eligible user)');
        return;
      }
      const [beforeRows] = await db.query('SELECT status FROM tasks WHERE id = ?', [task.id]);
      const from = beforeRows[0].status;
      const to = nextStatus(from);
      const res = await request(base, `/tasks/${task.id}/status`, 'PATCH', token, { status: to });
      const [afterRows] = await db.query('SELECT status FROM tasks WHERE id = ?', [task.id]);
      const updated = afterRows[0].status;

      const passStatus = res.status === expectedStatusCode;
      const passData = expectedStatusCode === 200 ? updated === to : updated === from;
      log(`${name} drag/drop`, passStatus && passData, `status=${res.status}, from=${from}, to=${to}, updated=${updated}`);
    };

    await moveAndVerify('Admin', adminToken, 200);
    await moveAndVerify('Team Lead', leadToken, 200);
    await moveAndVerify('Member', memberToken, 200);
    await moveAndVerify('Outsider', outsiderToken, outsiderToken ? 403 : 200);
  } finally {
    server.close();
  }

  console.log('\n=== Drag/Drop Role Accuracy ===');
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} - ${r.name} ${r.detail ? `(${r.detail})` : ''}`);
  }
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\nSummary: ${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error('verify-dnd-roles error:', err.message || err);
  process.exit(1);
});
