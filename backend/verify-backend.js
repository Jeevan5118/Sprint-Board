
const BASE_URL = 'http://localhost:5001/api';
let adminToken = '';
let projectId = '';

const uniqueId = Date.now();
const memberEmail = `test_member_${uniqueId}@example.com`;
const memberPassword = 'Password123!';
let memberToken = '';
let teamId = null;

async function runTests() {
    console.log('🚀 Starting Backend Verification Tests (Node ' + process.version + ')...\n');

    try {
        // 1. Health Check
        await testHealth();

        // 2. Login Admin
        await testLoginAdmin();

        // 3. Resolve Team
        await testResolveTeam();

        // 4. Admin Creates Member Account
        await testAdminCreateMember();

        // 5. Member Login
        await testLoginMember();

        // 6. Create Project
        await testCreateProject();

        console.log('\n✅ All tests completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`${method} ${endpoint} failed: ${data.message || response.statusText}`);
    }
    return data;
}

async function testHealth() {
    process.stdout.write('1. Testing Health Check... ');
    const data = await request('/health');
    if (data.success) console.log('✅ Passed');
    else throw new Error('Health check failed');
}

async function testLoginAdmin() {
    process.stdout.write('2. Testing Admin Login... ');
    let body = { email: 'admin@scrumboard.com', password: 'password123' };

    try {
        const data = await request('/auth/login', 'POST', body);
        if (data.success && data.data.token) {
            adminToken = data.data.token;
            console.log('✅ Passed (Default Password)');
            return;
        }
    } catch (e) {
        body.password = 'admin123';
        try {
            const data = await request('/auth/login', 'POST', body);
            if (data.success && data.data.token) {
                adminToken = data.data.token;
                console.log('✅ Passed (Reset Password)');
                return;
            }
        } catch (e2) {
            console.log('⚠️ Login Failed for Admin. Cannot test Project Creation.');
            throw new Error('Admin login failed');
        }
    }
}

async function testResolveTeam() {
    process.stdout.write('3. Resolving Team for assignment... ');
    const teamsData = await request('/teams', 'GET', null, adminToken);
    if (teamsData.success && teamsData.data.teams.length > 0) {
        teamId = teamsData.data.teams[0].id;
        console.log('✅ Passed');
        return;
    }
    throw new Error('No team found. Create at least one team before running smoke test.');
}

async function testAdminCreateMember() {
    process.stdout.write('4. Testing Admin Creates Member... ');
    const body = {
        email: memberEmail,
        password: memberPassword,
        first_name: 'Test',
        last_name: 'Member',
        role: 'member',
        team_id: teamId
    };
    const data = await request('/auth/users', 'POST', body, adminToken);
    if (data.success && data.data.user) {
        console.log('✅ Passed');
        return;
    }
    throw new Error('Admin user creation failed');
}

async function testLoginMember() {
    process.stdout.write('5. Testing Member Login... ');
    const body = { email: memberEmail, password: memberPassword };
    const data = await request('/auth/login', 'POST', body);
    if (data.success && data.data.token) {
        memberToken = data.data.token;
        console.log('✅ Passed');
        return;
    }
    throw new Error('Member login failed');
}

async function testCreateProject() {
    if (!adminToken) return;
    process.stdout.write('6. Testing Create Project (Admin)... ');
    const body = {
        name: `Test Project ${uniqueId}`,
        key_code: `TP${Math.floor(Math.random() * 1000)}`,
        description: 'Automated test project',
        team_id: teamId
    };

    try {
        const data = await request('/projects', 'POST', body, adminToken);
        if (data.success) {
            projectId = data.data.project.id;
            console.log('✅ Passed');
        }
    } catch (e) {
        throw new Error(`Create Project Flow failed: ${e.message}`);
    }
}

runTests();
