import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8000/ws');
let matchId;

ws.on('open', () => {
    console.log('Connected to WS');
    createMatchAndSubscribe();
});

function createMatchAndSubscribe() {
    const matchData = {
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(Date.now() + 100000).toISOString(),
        endTime: new Date(Date.now() + 200000).toISOString(),
        location: 'Stadium Y',
        sport: 'Basketball'
    };
    fetch('http://localhost:8000/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
    }).then(res => {
        if (!res.ok) throw new Error(`Match creation failed: ${res.status}`);
    });
}

async function updateScore(id) {
    const scoreData = {
        homeScore: 1,
        awayScore: 0
    };

    console.log(`Updating score for match ${id}...`);
    const response = await fetch(`http://localhost:8000/matches/${id}/score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
    });

    if (!response.ok) {
        console.error(`Score update failed: ${response.status}`);
        process.exit(1);
    }
    console.log('Score updated via API');
}

ws.on('message', (data) => {
    let message;
    try {
        message = JSON.parse(data.toString());
    } catch (error) {
        console.error('Failed to parse WS message:', data.toString(), error.message);
        return;
    }
    console.log('Received message type:', message.type);

    if (message.type === 'match_created') {
        matchId = message.data.id;
        console.log(`Match created with ID: ${matchId}, subscribing...`);
        ws.send(JSON.stringify({ type: 'subscribe', matchId: matchId }));
    } else if (message.type === 'subscribed') {
        console.log('Subscribed! Updating score...');
        updateScore(matchId);
    } else if (message.type === 'score_update') {
        console.log('SUCCESS: Score update broadcast received!', message.data);
        if (message.data.matchId === matchId && message.data.homeScore === 1 && message.data.awayScore === 0) {
            console.log('Verification Passed!');
            ws.close();
            process.exit(0);
        } else {
            console.error('Verification Failed: Incorrect score data');
            process.exit(1);
        }

    }
});

ws.on('error', (err) => {
    console.error('WS Error:', err);
    process.exit(1);
});

// Wait a bit for broadcast, if not received then fail
setTimeout(() => {
    console.error('TIMEOUT: Score update broadcast NOT received.');
    process.exit(1);
}, 5000);
