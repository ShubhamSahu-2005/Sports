import AgentAPI from 'apminsight';
AgentAPI.config();
import 'dotenv/config';
import express from "express";
import http from "http"
import { matchRouter } from "./routes/matches.js";
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from './routes/commentary.js';


const app = express();
const rawPort = process.env.PORT;
const parsedPort = Number(rawPort);
const isPortValid = Number.isFinite(parsedPort) && Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65535;
const PORT = isPortValid ? parsedPort : 8000;
const HOST = process.env.HOST || '0.0.0.0';
const server = http.createServer(app);

app.use(express.json());

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        if (process.env.NODE_ENV === 'development') {
            console.error("JSON Syntax Error. Raw body received:", err.body); // Debug log
        }
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

app.use(securityMiddleware);
app.get("/", (req, res) => {
    res.send("Hello World!!")
});

app.use('/matches', matchRouter);
app.use('/matches/:id/commentary', commentaryRouter)

const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary




server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);


    console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);
})