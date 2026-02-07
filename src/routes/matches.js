import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema, updateScoreSchema, matchIdParamSchema } from "../validation/matches.js";

import { getMatchStatus } from "../utils/match-status.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

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
        console.error("Error listing matches:", error);
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
        if (req.app.locals.broadcastMatchCreated) {
            Promise.resolve(req.app.locals.broadcastMatchCreated(event)).catch(err => {
                console.error("Failed to broadcast match created:", err);
            });
        }
        res.status(201).json({
            data: event
        })

    } catch (err) {
        console.error("Error creating match:", err);
        res.status(500).json({ error: 'Failed to create a match' })
    }

})

matchRouter.patch('/:id/score', async (req, res) => {
    const { id } = matchIdParamSchema.parse(req.params);
    const parsed = updateScoreSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid Payload', details: JSON.stringify(parsed.error)
        })
    }

    try {
        const [updatedMatch] = await db.update(matches)
            .set(parsed.data)
            .where(eq(matches.id, id))
            .returning();

        if (!updatedMatch) {
            return res.status(404).json({ error: 'Match not found' });
        }

        if (req.app.locals.broadcastMatchScoreUpdated) {
            req.app.locals.broadcastMatchScoreUpdated(id, parsed.data);
        }

        res.status(200).json({ data: updatedMatch });

    } catch (error) {
        console.error("Error updating match score:", error);
        res.status(500).json({ error: "Failed to update match score" });
    }
})