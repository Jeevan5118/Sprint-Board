
const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

const uniqueId = Date.now();
const email = `frontend_sim_${uniqueId}@example.com`;

async function testFrontendFlow() {
    console.log(`Testing Registration Flow for ${email}...`);

    try {
        const response = await api.post('/auth/register', {
            first_name: 'Frontend',
            last_name: 'Sim',
            email: email,
            password: 'Password123!',
            role: 'member'
        });

        console.log('✅ Registration Success:', response.data);

        // Try Login
        console.log('Testing Login...');
        const loginRes = await api.post('/auth/login', {
            email: email,
            password: 'Password123!'
        });
        console.log('✅ Login Success:', loginRes.data);

    } catch (error) {
        console.log('❌ Request Failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testFrontendFlow();
