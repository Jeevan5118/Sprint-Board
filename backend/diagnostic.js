const http = require('http');

const urls = [
    '/api/tasks/1',
    '/api/comments/task/1',
    '/api/projects/1',
    '/api/tasks/sprint/5'
];

function test(url) {
    return new Promise((resolve) => {
        http.get(`http://localhost:5001${url}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`URL: ${url}`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Body: ${data}`);
                console.log('---');
                resolve();
            });
        }).on('error', (err) => {
            console.log(`URL: ${url}`);
            console.log(`Error: ${err.message}`);
            console.log('---');
            resolve();
        });
    });
}

async function runTests() {
    for (const url of urls) {
        await test(url);
    }
}

runTests();
