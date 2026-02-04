import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { parseEWKB } from "drizzle-orm/pg-core/columns/postgis_extension/utils";
import { getMatchStatus } from "../utils/match-status.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();
const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({
            error: "Invalid query", details: JSON.stringify(parsed.error)
        })
    }
    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
    try {
        const data = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);
        res.status(200).json({ data });

    } catch (error) {
        res.status(500).json({
            error: "Failed to list matches"
        })

    }


})

matchRouter.post('/', async (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            error: 'Invalid Payload',
            details: "Request body is missing. Ensure you are sending JSON and setting Content-Type: application/json"
        });
    }

    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid Payload', details: JSON.stringify(parsed.error)
        })
    }

    const { startTime, endTime, homeScore, awayScore } = parsed.data;

    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),

        }).returning();
        res.status(201).json({
            data: event
        })

    } catch (err) {
        res.status(500).json({ error: 'Failed to create a match', details: JSON.stringify(err) })
    }

})