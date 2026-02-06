import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8000/ws');
let matchId;

ws.on('open', () => {
    console.log('Connected to WS');
    createMatchAndSubscribe();
});

ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received message:', message);

    if (message.type === 'match_created') {
        matchId = message.data.id;
        console.log(`Match created with ID: ${matchId}, subscribing...`);
        ws.send(JSON.stringify({ type: 'subscribe', matchId: matchId }));
    } else if (message.type === 'subscribed') {
        console.log('Subscribed! Sending commentary...');
        sendCommentary(matchId);
    } else if (message.type === 'commentary') {
        console.log('SUCCESS: Commentary broadcast received!', message.data);
        ws.close();
        process.exit(0);
    }
});

ws.on('error', (err) => {
    console.error('WS Error:', err);
    process.exit(1);
});

async function createMatch() {
    const matchData = {
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date(Date.now() + 100000).toISOString(),
        endTime: new Date(Date.now() + 200000).toISOString(),
        location: 'Stadium Y',
        sport: 'Basketball'
    };

    const response = await fetch('http://localhost:8000/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
    });

    if (!response.ok) throw new Error(`Match creation failed: ${response.status}`);
}

async function createMatchAndSubscribe() {
    // This will trigger 'match_created' event which we listen to
    await createMatch();
}

async function sendCommentary(id) {
    const commentaryData = {
        message: "What a goal!",
        minute: 12,
        sequence: 1,
        period: "First Half",
        eventType: "Goal",
        actor: "Player X",
        team: "Team A"
    };

    console.log(`Posting commentary for match ${id}...`);
    const response = await fetch(`http://localhost:8000/matches/${id}/commentary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentaryData)
    });

    if (!response.ok) {
        console.error(`Commentary post failed: ${response.status} ${await response.text()}`);
        process.exit(1);
    }
    console.log('Commentary posted via API');

    // Wait a bit for broadcast, if not received then fail
    setTimeout(() => {
        console.error('TIMEOUT: Commentary broadcast NOT received.');
        process.exit(1);
    }, 2000);
}
