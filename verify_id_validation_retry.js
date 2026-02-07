
async function testInvalidId() {
    console.log('Testing Invalid ID Validation...');

    const endpoints = [
        { method: 'PATCH', url: 'http://localhost:8000/matches/invalid/score', body: { homeScore: 1, awayScore: 1 } },
        { method: 'POST', url: 'http://localhost:8000/matches/invalid/commentary', body: { message: "test" } },
        { method: 'GET', url: 'http://localhost:8000/matches/invalid/commentary' }
    ];

    let passed = true;

    for (const ep of endpoints) {
        try {
            const options = {
                method: ep.method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (ep.body) options.body = JSON.stringify(ep.body);

            const res = await fetch(ep.url, options);

            if (res.status === 400) {
                const data = await res.json();
                if (data.error === 'Invalid Params') {
                    console.log(`PASS: ${ep.method} ${ep.url} returned 400 Invalid Params`);
                } else {
                    console.error(`FAIL: ${ep.method} ${ep.url} returned 400 but unexpected error message:`, data);
                    passed = false;
                }
            } else {
                console.error(`FAIL: ${ep.method} ${ep.url} returned status ${res.status}`);
                passed = false;
            }
        } catch (err) {
            console.error(`FAIL: ${ep.method} ${ep.url} failed with request error:`, err);
            passed = false;
        }
    }

    if (passed) {
        console.log('All ID validation tests PASSED');
        process.exit(0);
    } else {
        console.error('Some ID validation tests FAILED');
        process.exit(1);
    }
}

testInvalidId();
