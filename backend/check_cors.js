
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/register',
    method: 'OPTIONS',
    headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('HEADERS:');
    console.log(JSON.stringify(res.headers, null, 2));

    if (res.headers['access-control-allow-origin'] === 'http://localhost:3000') {
        console.log('✅ CORS Header Present and Correct');
    } else {
        console.log('❌ CORS Header Missing or Incorrect');
    }
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
