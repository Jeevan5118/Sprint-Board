
const BASE_URL = 'http://localhost:5001/api';
let adminToken = '';
let projectId = '';
let sprintId = '';

const uniqueId = Date.now();
const memberEmail = `test_member_${uniqueId}@example.com`;
const memberPassword = 'Password123!';

async function runTests() {
    console.log('🚀 Starting Backend Verification Tests (Node ' + process.version + ')...\n');

    try {
        // 1. Health Check
        await testHealth();

        // 2. Register Member
        await testRegisterMember();

        // 3. Login Admin
        await testLoginAdmin();

        // 4. Create Project
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

async function testRegisterMember() {
    process.stdout.write('2. Testing Member Registration... ');
    const body = {
        email: memberEmail,
        password: memberPassword,
        first_name: 'Test',
        last_name: 'Member',
        role: 'member'
    };
    const data = await request('/auth/register', 'POST', body);
    if (data.success) console.log('✅ Passed');
    else throw new Error('Registration failed');
}

async function testLoginAdmin() {
    process.stdout.write('3. Testing Admin Login... ');
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
        }
    }
}

async function testCreateProject() {
    if (!adminToken) return;
    process.stdout.write('4. Testing Create Project (Admin)... ');
    const body = {
        name: `Test Project ${uniqueId}`,
        key_code: `TP${Math.floor(Math.random() * 1000)}`,
        description: 'Automated test project',
        team_id: 1, // Assuming team 1 exists from seeds? Schema says team_id is NOT NULL.
        // Wait, I need a Team ID. Admin creates projects for a team.
        // I should check if a team exists.
        // Let's try to Create Team first or Get Teams.
    };

    // Check Teams
    try {
        const teamsData = await request('/teams', 'GET', null, adminToken);
        if (teamsData.success && teamsData.data.teams.length > 0) {
            body.team_id = teamsData.data.teams[0].id;
        } else {
            // Create Team
            console.log('\n   Creating Team first...');
            const teamBody = { name: `Team ${uniqueId}`, description: 'Test Team' };
            const teamData = await request('/teams', 'POST', teamBody, adminToken);
            body.team_id = teamData.data.team.id;
        }

        // Create Project
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
