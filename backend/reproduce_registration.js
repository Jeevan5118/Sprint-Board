
const BASE_URL = 'http://localhost:5001/api';
const uniqueId = Date.now();

async function testRegistration() {
    console.log('Testing Registration...');

    // 1. Try to register a new member
    const memberEmail = `test_reproduce_${uniqueId}@example.com`;
    console.log(`\nAttempting to register NEW member: ${memberEmail}`);
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Test',
                last_name: 'User',
                email: memberEmail,
                password: 'Password123!',
                role: 'member'
            })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Network/Fetch Error:', err.message);
    }

    // 2. Try to register an Admin (to see if that fails)
    console.log(`\nAttempting to register NEW admin: admin_${uniqueId}@example.com`);
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'Admin',
                last_name: 'Test',
                email: `admin_${uniqueId}@example.com`,
                password: 'Password123!',
                role: 'admin'
            })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Network/Fetch Error:', err.message);
    }
}

testRegistration();
