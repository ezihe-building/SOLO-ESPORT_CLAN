import { Router } from "express";
import { db, scrimsTable, scrimParticipantsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireManagement } from "../lib/auth";
import {
  CreateScrimBody,
  GetScrimParams,
  UpdateScrimBody,
  UpdateScrimParams,
  DeleteScrimParams,
  RegisterForScrimParams,
  UnregisterFromScrimParams,
  PostScrimResultBody,
  PostScrimResultParams,
} from "@workspace/api-zod";

const router = Router();

async function formatScrim(s: any) {
  const participants = await db.select().from(scrimParticipantsTable)
    .where(eq(scrimParticipantsTable.scrimId, s.id));

  const participantDetails = await Promise.all(
    participants.map(async (p) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
      return user ? {
        userId: user.id,
        username: user.username,
        clanTag: `S²十${user.username}`,
        avatarUrl: user.avatarUrl ?? null,
      } : null;
    })
  );

  return {
    id: s.id,
    title: s.title,
    description: s.description ?? null,
    imageUrl: s.imageUrl ?? null,
    link: s.link ?? null,
    scheduledAt: s.scheduledAt ?? null,
    status: s.status,
    result: s.result ?? null,
    participants: participantDetails.filter(Boolean),
    createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
  };
}

router.get("/scrims", async (req, res): Promise<void> => {
  const scrims = await db.select().from(scrimsTable).orderBy(scrimsTable.createdAt);
  const formatted = await Promise.all(scrims.map(formatScrim));
  res.json(formatted);
});

router.post("/scrims", requireManagement, async (req, res): Promise<void> => {
  const parsed = CreateScrimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [scrim] = await db.insert(scrimsTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    link: parsed.data.link ?? null,
    scheduledAt: parsed.data.scheduledAt ?? null,
    status: "UPCOMING",
  }).returning();

  res.status(201).json(await formatScrim(scrim));
});

router.get("/scrims/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetScrimParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scrim] = await db.select().from(scrimsTable).where(eq(scrimsTable.id, params.data.id));
  if (!scrim) {
    res.status(404).json({ error: "Scrim not found" });
    return;
  }

  res.json(await formatScrim(scrim));
});

router.patch("/scrims/:id", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateScrimParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateScrimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, any> = {};
  if (parsed.data.title != null) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.imageUrl !== undefined) updates.imageUrl = parsed.data.imageUrl;
  if (parsed.data.link !== undefined) updates.link = parsed.data.link;
  if (parsed.data.scheduledAt !== undefined) updates.scheduledAt = parsed.data.scheduledAt;
  if (parsed.data.status != null) updates.status = parsed.data.status;

  const [scrim] = await db.update(scrimsTable).set(updates)
    .where(eq(scrimsTable.id, params.data.id)).returning();

  if (!scrim) {
    res.status(404).json({ error: "Scrim not found" });
    return;
  }

  res.json(await formatScrim(scrim));
});

router.delete("/scrims/:id", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteScrimParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(scrimParticipantsTable).where(eq(scrimParticipantsTable.scrimId, params.data.id));
  await db.delete(scrimsTable).where(eq(scrimsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/scrims/:id/register", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RegisterForScrimParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req.session as any).userId;
  const existing = await db.select().from(scrimParticipantsTable)
    .where(and(eq(scrimParticipantsTable.scrimId, params.data.id), eq(scrimParticipantsTable.userId, userId)));

  if (existing.length > 0) {
    res.json({ message: "Already registered" });
    return;
  }

  await db.insert(scrimParticipantsTable).values({ scrimId: params.data.id, userId });
  res.json({ message: "Registered successfully" });
});

router.delete("/scrims/:id/register", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UnregisterFromScrimParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req.session as any).userId;
  await db.delete(scrimParticipantsTable)
    .where(and(eq(scrimParticipantsTable.scrimId, params.data.id), eq(scrimParticipantsTable.userId, userId)));

  res.json({ message: "Unregistered successfully" });
});

router.patch("/scrims/:id/result", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = PostScrimResultParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = PostScrimResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [scrim] = await db.update(scrimsTable)
    .set({ result: parsed.data.result, status: parsed.data.status ?? "COMPLETED" })
    .where(eq(scrimsTable.id, params.data.id))
    .returning();

  if (!scrim) {
    res.status(404).json({ error: "Scrim not found" });
    return;
  }

  res.json(await formatScrim(scrim));
});

export default router;
