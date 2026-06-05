import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireManagement } from "../lib/auth";
import {
  CreateEventBody,
  GetEventParams,
  UpdateEventBody,
  UpdateEventParams,
  DeleteEventParams,
} from "@workspace/api-zod";

const router = Router();

function formatEvent(e: any) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    imageUrl: e.imageUrl ?? null,
    link: e.link ?? null,
    eventDate: e.eventDate ?? null,
    createdAt: e.createdAt?.toISOString?.() ?? e.createdAt,
    updatedAt: e.updatedAt?.toISOString?.() ?? e.updatedAt,
  };
}

router.get("/events", async (req, res): Promise<void> => {
  const events = await db.select().from(eventsTable).orderBy(eventsTable.createdAt);
  res.json(events.map(formatEvent));
});

router.post("/events", requireManagement, async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [evt] = await db.insert(eventsTable).values({
    title: parsed.data.title,
    description: parsed.data.description,
    imageUrl: parsed.data.imageUrl ?? null,
    link: parsed.data.link ?? null,
    eventDate: parsed.data.eventDate ?? null,
  }).returning();

  res.status(201).json(formatEvent(evt));
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetEventParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [evt] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!evt) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(formatEvent(evt));
});

router.patch("/events/:id", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateEventParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, any> = {};
  if (parsed.data.title != null) updates.title = parsed.data.title;
  if (parsed.data.description != null) updates.description = parsed.data.description;
  if (parsed.data.imageUrl !== undefined) updates.imageUrl = parsed.data.imageUrl;
  if (parsed.data.link !== undefined) updates.link = parsed.data.link;
  if (parsed.data.eventDate !== undefined) updates.eventDate = parsed.data.eventDate;

  const [evt] = await db.update(eventsTable).set(updates)
    .where(eq(eventsTable.id, params.data.id)).returning();

  if (!evt) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(formatEvent(evt));
});

router.delete("/events/:id", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteEventParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(eventsTable).where(eq(eventsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
