import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8000/ws');

ws.on('open', () => {
    console.log('Connected to WS');

    // Trigger match creation after a short delay to ensure WS is ready
    setTimeout(createMatch, 1000);
});

ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('Received message:', message);
    if (message.type === 'match_created') {
        console.log('SUCCESS: Match created broadcast received!');
        ws.close();
        process.exit(0);
    }
});

ws.on('error', (err) => {
    console.error('WS Error:', err);
    process.exit(1);
});

async function createMatch() {
    try {
        const matchData = {
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            startTime: new Date(Date.now() + 100000).toISOString(),
            endTime: new Date(Date.now() + 200000).toISOString(),
            location: 'Stadium X',
            sport: 'Football'
        };

        console.log('Creating match...');
        const response = await fetch('http://localhost:8000/matches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matchData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Match created via API:', data);
    } catch (error) {
        console.error('API Error:', error.message);
        process.exit(1);
    }
}
