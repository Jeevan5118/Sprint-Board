const http = require('http');

const EMAIL = 'admin@scrumboard.com';
const PASSWORD = 'admin123';
const HOST = 'localhost';
const PORT = 5001;

async function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (e) { }
                resolve({ status: res.statusCode, data: parsed, raw: data });
            });
        });

        req.on('error', (err) => reject(err));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function test() {
    try {
        process.stdout.write('Logging in... ');
        const loginRes = await request('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });
        if (loginRes.status !== 200) {
            console.log('Login failed:', loginRes.status, loginRes.data);
            return;
        }
        const token = loginRes.data.data.token;
        console.log('Login success.');

        const endpoints = [
            '/api/tasks/sprint/5',
            '/api/tasks/project/3',
            '/api/projects/3',
            '/api/sprints/project/3'
        ];

        for (const ep of endpoints) {
            process.stdout.write(`Testing ${ep}... `);
            const res = await request('GET', ep, null, token);
            if (res.status === 200) {
                console.log(`Success (${res.status})`);
            } else {
                console.log(`Failed (${res.status}) - ${res.data?.message || 'Error'}`);
            }
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

test();
