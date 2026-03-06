const BASE_URL = 'http://localhost:5001/api';
let adminToken = '';
let teamId = null;

const uniqueId = Date.now();
const memberEmail = `test_member_${uniqueId}@example.com`;
const memberPassword = 'Password123!';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`${method} ${endpoint} failed: ${data.message || res.statusText}`);
  }
  return data;
}

async function run() {
  console.log('Backend scripts/verify-backend.js');

  await request('/health');

  let login = null;
  try {
    login = await request('/auth/login', 'POST', {
      email: 'admin@scrumboard.com',
      password: 'password123'
    });
  } catch (e) {
    login = await request('/auth/login', 'POST', {
      email: 'admin@scrumboard.com',
      password: 'admin123'
    });
  }
  adminToken = login.data.token;

  const teamsData = await request('/teams', 'GET', null, adminToken);
  if (!teamsData.data.teams?.length) {
    throw new Error('No teams available');
  }
  teamId = teamsData.data.teams[0].id;

  await request('/auth/users', 'POST', {
    email: memberEmail,
    password: memberPassword,
    first_name: 'Script',
    last_name: 'Member',
    role: 'member',
    team_id: teamId
  }, adminToken);

  await request('/auth/login', 'POST', {
    email: memberEmail,
    password: memberPassword
  });

  await request('/projects', 'POST', {
    name: `Script Project ${uniqueId}`,
    key_code: `SP${Math.floor(Math.random() * 1000)}`,
    description: 'Script-created project',
    team_id: teamId
  }, adminToken);

  console.log('Smoke flow passed.');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
