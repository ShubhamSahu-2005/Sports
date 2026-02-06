import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }
    socket.send(JSON.stringify(payload));

}
function broadCast(wss, payload) {
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
        sendJson(socket, { type: 'welcome' });
        socket.on('error', console.error);
    })
    function broadcastMatchCreated(match) {
        broadCast(wss, {
            type: 'match_created',
            data: match,
        })
    }
    return { broadcastMatchCreated }
}