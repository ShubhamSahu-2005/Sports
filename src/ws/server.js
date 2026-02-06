import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";
const matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket);
}
function unsubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) {
        return;
    }
    subscribers.delete(socket);
    if (subscribers.size === 0) {
        matchSubscribers.delete(matchId)
    }
}
function cleanupSubscriptions(socket) {
    for (const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket);
    }

}
function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers || subscribers.size === 0) {
        return;
    }
    const message = JSON.stringify(payload);
    for (const client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}
function handleMessage(socket, data) {
    let message;
    try {
        message = JSON.parse(data.toString());

    } catch {
        sendJson(socket, { type: 'error', data: { message: 'Invalid message' } })
        return;
    }
    if (message?.type === 'subscribe' && Number.isInteger(message.matchId)) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJson(socket, { type: 'subscribed', data: { matchId: message.matchId } })
        return;
    }
    if (message?.type === 'unsubscribe' && Number.isInteger(message.matchId)) {
        unsubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, { type: 'unsubscribed', data: { matchId: message.matchId } })
        return;
    }

}


function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }
    socket.send(JSON.stringify(payload));

}
function broadCastToAll(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;

        sendJson(client, payload);
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
    })
    wss.on("connection", async (socket, req) => {
        if (wsArcjet) {
            try {
                // Arcjet requires a User-Agent header for bot detection.
                if (!req.headers['user-agent']) {
                    req.headers['user-agent'] = 'unknown';
                }
                const decision = await wsArcjet.protect(req);
                if (decision.isDenied()) {
                    const code = decision.reason?.isRateLimit?.() ? 1013 : 1008;
                    const reason = decision.reason?.isRateLimit?.() ? "Too many requests" : "Access Denied";
                    socket.close(code, reason);
                    return;
                }

            } catch (error) {
                console.error('WS connection error', error);
                socket.close(1011, 'Server security error');
                return;
            }
        }
        socket.subscriptions = new Set();

        sendJson(socket, { type: 'welcome' });

        socket.on('message', (data) => {
            handleMessage(socket, data);
        });
        socket.on('error', () => {
            socket.terminate();
        });

        socket.on('close', () => {
            cleanupSubscriptions(socket);
        })
    });




    function broadcastMatchCreated(match) {
        broadCastToAll(wss, {
            type: 'match_created',
            data: match,
        })
    }
    function broadcastCommentary(matchId, commentary) {
        broadcastToMatch(matchId, { type: 'commentary', data: commentary })
    }


    return { broadcastMatchCreated, broadcastCommentary }
}