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

async function run() {
  const [admins] = await db.query("SELECT id, email, role FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  const [members] = await db.query(
    "SELECT id, email, role FROM users WHERE role = 'member' ORDER BY id LIMIT 1"
  );
  const admin = admins[0];
  const member = members[0];

  if (!admin || !member) {
    throw new Error('Required users not found: need at least one admin and one non-admin user');
  }

  const adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
  const memberToken = generateToken({ id: member.id, email: member.email, role: member.role });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api`;

  const tests = [];
  const push = (name, pass, details = '') => tests.push({ name, pass, details });

  try {
    const adminUsers = await request(base, '/auth/users', 'GET', adminToken);
    push('Admin can fetch /auth/users', adminUsers.status === 200, `status=${adminUsers.status}`);

    const memberUsers = await request(base, '/auth/users', 'GET', memberToken);
    push('Member blocked from /auth/users', memberUsers.status === 403, `status=${memberUsers.status}`);

    const registerWithoutAuth = await request(base, '/auth/register', 'POST', null, {
      first_name: 'Role',
      last_name: 'Probe',
      email: `role_probe_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'admin'
    });
    push(
      'Public register blocked (admin-only policy)',
      registerWithoutAuth.status === 401,
      `status=${registerWithoutAuth.status}`
    );

    const registerByMember = await request(base, '/auth/register', 'POST', memberToken, {
      first_name: 'Role',
      last_name: 'ProbeMember',
      email: `role_probe_member_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'member'
    });
    push(
      'Non-admin register blocked',
      registerByMember.status === 403,
      `status=${registerByMember.status}`
    );

    const registerByAdmin = await request(base, '/auth/register', 'POST', adminToken, {
      first_name: 'Role',
      last_name: 'ProbeAdmin',
      email: `role_probe_admin_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'member'
    });
    push(
      'Admin can register member account',
      registerByAdmin.status === 201,
      `status=${registerByAdmin.status}`
    );

    const memberCreateTask = await request(base, '/tasks', 'POST', memberToken, {
      title: 'AuthZ test task',
      project_id: 1
    });
    push('Member blocked from creating task', memberCreateTask.status === 403, `status=${memberCreateTask.status}`);
  } finally {
    server.close();
  }

  console.log('\n=== Authorization Smoke ===');
  tests.forEach((t) => {
    console.log(`${t.pass ? 'PASS' : 'FAIL'} - ${t.name} ${t.details ? `(${t.details})` : ''}`);
  });
  const failed = tests.filter((t) => !t.pass).length;
  console.log(`\nSummary: ${tests.length - failed}/${tests.length} passed`);
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error('verify-authz error:', err.message || err);
  process.exit(1);
});
