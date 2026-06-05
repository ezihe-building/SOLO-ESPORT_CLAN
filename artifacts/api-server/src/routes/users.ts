import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireManagement, isManagement } from "../lib/auth";
import { GetUserParams, UpdateUserBody, UpdateUserStatsBody, UpdateUserStatsParams, UpdateUserParams } from "@workspace/api-zod";
import { formatUser } from "./auth";

const router = Router();

router.get("/users", async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable)
    .where(eq(usersTable.status, "ACTIVE"));
  res.json(users.map(formatUser));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const sessionUserId = (req.session as any).userId;
  const sessionRole = (req.session as any).role || "";

  // Can only update own profile unless management
  if (params.data.id !== sessionUserId && !isManagement(sessionRole)) {
    res.status(403).json({ error: "Cannot update another user's profile" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, any> = {};
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.whatsapp !== undefined) updates.whatsapp = parsed.data.whatsapp;
  if (parsed.data.tiktok !== undefined) updates.tiktok = parsed.data.tiktok;
  if (parsed.data.instagram !== undefined) updates.instagram = parsed.data.instagram;
  if (parsed.data.discord !== undefined) updates.discord = parsed.data.discord;

  const [user] = await db.update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/users/:id/stats", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserStatsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserStatsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, any> = {};
  if (parsed.data.kills != null) updates.kills = parsed.data.kills;
  if (parsed.data.deaths != null) updates.deaths = parsed.data.deaths;
  if (parsed.data.wins != null) updates.wins = parsed.data.wins;
  if (parsed.data.losses != null) updates.losses = parsed.data.losses;
  if (parsed.data.clanPoints != null) updates.clanPoints = parsed.data.clanPoints;
  if (parsed.data.mvpCount != null) updates.mvpCount = parsed.data.mvpCount;
  if (parsed.data.activity != null) updates.activity = parsed.data.activity;
  if (parsed.data.tournamentWins != null) updates.tournamentWins = parsed.data.tournamentWins;
  if (parsed.data.scrimWins != null) updates.scrimWins = parsed.data.scrimWins;

  // Auto-calculate K/D
  if (updates.kills !== undefined || updates.deaths !== undefined) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
    if (existing) {
      const kills = updates.kills ?? existing.kills;
      const deaths = updates.deaths ?? existing.deaths;
      updates.kdRatio = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
    }
  }

  const [user] = await db.update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

export default router;
