import http from 'http';

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/matches/2/commentary',
    method: 'GET',
    headers: {
        'User-Agent': 'PostmanRuntime/7.28.0',
        'Content-Type': 'application/json' // Suspicious header for GET
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => console.error(e));
req.end();
