import { Router } from "express";
import { db } from "../db/db.js";
import { commentary, matches } from "../db/schema.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.post("/", async (req, res) => {
    try {
        const { id } = matchIdParamSchema.parse(req.params);

        const [matchExists] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);

        if (!matchExists) {
            return res.status(404).json({ error: "Match not found" });
        }

        const body = createCommentarySchema.parse(req.body);

        const [result] = await db.insert(commentary).values({
            ...body,
            matchId: id
        }).returning();
        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(result.matchId, result)
        }


        res.status(201).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

commentaryRouter.get("/", async (req, res) => {
    try {
        const { id } = matchIdParamSchema.parse(req.params);
        const query = listCommentaryQuerySchema.parse(req.query);

        const limit = Math.min(query.limit ?? 50, 100);

        const data = await db.select()
            .from(commentary)
            .where(eq(commentary.matchId, id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({ data });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
