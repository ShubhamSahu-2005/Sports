import { WebSocket, WebSocketServer } from "ws";
/**
 * Send a JSON-serializable payload over a WebSocket when the socket is open.
 *
 * If the socket is not open, the function does nothing.
 * @param {WebSocket} socket - The WebSocket to send the payload through.
 * @param {*} payload - The value to serialize to JSON and send.
 */
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }
    socket.send(JSON.stringify(payload));

}
/**
 * Broadcast a JSON-serializable payload to connected WebSocket clients.
 *
 * Sends JSON.stringify(payload) to each client in wss.clients until a client
 * whose readyState is not WebSocket.OPEN is encountered, at which point
 * broadcasting stops and no further clients receive the payload.
 *
 * @param {object} wss - A WebSocket.Server instance (from the 'ws' library).
 * @param {*} payload - The value to serialize and send to clients.
 */
function broadCast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));
    }
}

/**
 * Attach a WebSocket server to the given HTTP/S server and expose a helper to broadcast match-created messages.
 *
 * The WebSocket server is mounted at path "/ws" and accepts payloads up to 1 MB. On each new connection it sends
 * a `{ type: 'welcome' }` message and attaches a basic error handler to the socket.
 *
 * @param {import('http').Server|import('https').Server} server - The HTTP or HTTPS server to attach the WebSocket server to.
 * @returns {{ broadcastMatchCreated: (match: any) => void }} An object with `broadcastMatchCreated(match)` which sends a `{ type: 'match_created', data: match }` payload to all connected WebSocket clients.
 */
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
    })
    wss.on("connection", (socket) => {
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