import { Router } from "express";
import { db, usersTable, announcementsTable, eventsTable, scrimsTable, scrimParticipantsTable, feedPostsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { formatUser } from "./auth";

const router = Router();
const PANEL_PASSWORD = "terrorist";

function verifyPanel(req: any, res: any): boolean {
  const token = req.headers["x-panel-token"] || req.body?.panelPassword || req.query?.panelPassword;
  if (token !== PANEL_PASSWORD) {
    res.status(403).json({ error: "Invalid panel password" });
    return false;
  }
  return true;
}

// ── AUTH ──
router.post("/panel/auth", (req, res): void => {
  const { password } = req.body;
  if (password !== PANEL_PASSWORD) {
    res.status(403).json({ error: "Wrong password" });
    return;
  }
  res.json({ ok: true });
});

// ── DASHBOARD STATS ──
router.get("/panel/stats", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const [users, announcements, events, scrims] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(announcementsTable),
    db.select().from(eventsTable),
    db.select().from(scrimsTable),
  ]);
  res.json({
    total: users.length,
    pending: users.filter(u => u.status === "PENDING").length,
    active: users.filter(u => u.status === "ACTIVE").length,
    suspended: users.filter(u => u.status === "SUSPENDED").length,
    rejected: users.filter(u => u.status === "REJECTED").length,
    tier1: users.filter(u => u.role === "TIER1" && u.status === "ACTIVE").length,
    tier2: users.filter(u => u.role === "TIER2" && u.status === "ACTIVE").length,
    tier3: users.filter(u => u.role === "TIER3" && u.status === "ACTIVE").length,
    management: users.filter(u => ["CLAN_MASTER", "CO_LEADER", "MANAGEMENT"].includes(u.role)).length,
    announcements: announcements.length,
    events: events.length,
    scrims: scrims.length,
    recentMembers: users
      .sort((a, b) => (b.joinedAt?.getTime() ?? 0) - (a.joinedAt?.getTime() ?? 0))
      .slice(0, 5)
      .map(formatUser),
  });
});

// ── MEMBERS ──
router.get("/panel/members", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.joinedAt));
  res.json(users.map(formatUser));
});

router.patch("/panel/members/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { role, status, kills, deaths, wins, losses, clanPoints, mvpCount, scrimWins, activity, tournamentWins } = req.body;
  const updates: Record<string, any> = {};
  if (role !== undefined) updates.role = role;
  if (status !== undefined) updates.status = status;
  if (kills !== undefined) updates.kills = Number(kills);
  if (deaths !== undefined) updates.deaths = Number(deaths);
  if (wins !== undefined) updates.wins = Number(wins);
  if (losses !== undefined) updates.losses = Number(losses);
  if (clanPoints !== undefined) updates.clanPoints = Number(clanPoints);
  if (mvpCount !== undefined) updates.mvpCount = Number(mvpCount);
  if (scrimWins !== undefined) updates.scrimWins = Number(scrimWins);
  if (activity !== undefined) updates.activity = Number(activity);
  if (tournamentWins !== undefined) updates.tournamentWins = Number(tournamentWins);

  if (updates.kills !== undefined || updates.deaths !== undefined) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (existing) {
      const k = updates.kills ?? existing.kills;
      const d = updates.deaths ?? existing.deaths;
      updates.kdRatio = d > 0 ? Math.round((k / d) * 100) / 100 : k;
    }
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.delete("/panel/members/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

// ── ANNOUNCEMENTS ──
router.get("/panel/announcements", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const rows = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
  res.json(rows.map(a => ({ ...a, createdAt: a.createdAt?.toISOString?.() ?? a.createdAt })));
});

router.post("/panel/announcements", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const { title, content, imageUrl, link, isPinned } = req.body;
  if (!title || !content) { res.status(400).json({ error: "title and content required" }); return; }
  const [row] = await db.insert(announcementsTable).values({
    title, content, imageUrl: imageUrl ?? null, link: link ?? null, isPinned: isPinned ?? false, authorId: null,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt });
});

router.patch("/panel/announcements/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { title, content, imageUrl, link, isPinned } = req.body;
  const updates: Record<string, any> = {};
  if (title != null) updates.title = title;
  if (content != null) updates.content = content;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (link !== undefined) updates.link = link;
  if (isPinned != null) updates.isPinned = isPinned;
  const [row] = await db.update(announcementsTable).set(updates).where(eq(announcementsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt });
});

router.delete("/panel/announcements/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.sendStatus(204);
});

// ── EVENTS ──
router.get("/panel/events", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));
  res.json(rows.map(e => ({ ...e, createdAt: e.createdAt?.toISOString?.() ?? e.createdAt })));
});

router.post("/panel/events", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const { title, description, imageUrl, link, eventDate } = req.body;
  if (!title || !description) { res.status(400).json({ error: "title and description required" }); return; }
  const [row] = await db.insert(eventsTable).values({
    title, description, imageUrl: imageUrl ?? null, link: link ?? null, eventDate: eventDate ?? null,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt });
});

router.patch("/panel/events/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { title, description, imageUrl, link, eventDate } = req.body;
  const updates: Record<string, any> = {};
  if (title != null) updates.title = title;
  if (description != null) updates.description = description;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (link !== undefined) updates.link = link;
  if (eventDate !== undefined) updates.eventDate = eventDate;
  const [row] = await db.update(eventsTable).set(updates).where(eq(eventsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt });
});

router.delete("/panel/events/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.sendStatus(204);
});

// ── SCRIMS ──
router.get("/panel/scrims", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const rows = await db.select().from(scrimsTable).orderBy(desc(scrimsTable.scheduledAt));
  res.json(rows);
});

router.post("/panel/scrims", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const { title, description, imageUrl, link, scheduledAt, status } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [row] = await db.insert(scrimsTable).values({
    title,
    description: description ?? null,
    imageUrl: imageUrl ?? null,
    link: link ?? null,
    scheduledAt: scheduledAt ?? new Date().toISOString(),
    status: status ?? "UPCOMING",
  }).returning();
  res.status(201).json(row);
});

router.patch("/panel/scrims/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { title, description, imageUrl, link, scheduledAt, status, result } = req.body;
  const updates: Record<string, any> = {};
  if (title != null) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (link !== undefined) updates.link = link;
  if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt;
  if (status != null) updates.status = status;
  if (result !== undefined) updates.result = result;
  const [row] = await db.update(scrimsTable).set(updates).where(eq(scrimsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/panel/scrims/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(scrimParticipantsTable).where(eq(scrimParticipantsTable.scrimId, id));
  await db.delete(scrimsTable).where(eq(scrimsTable.id, id));
  res.sendStatus(204);
});

// ── FEED ──
router.get("/panel/feed", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const posts = await db.select().from(feedPostsTable).orderBy(desc(feedPostsTable.createdAt));
  res.json(posts.map(p => ({ ...p, createdAt: p.createdAt?.toISOString?.() ?? p.createdAt })));
});

router.post("/panel/feed", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const { content, imageUrl, link } = req.body;
  if (!content) { res.status(400).json({ error: "content required" }); return; }
  const [row] = await db.insert(feedPostsTable).values({
    content, imageUrl: imageUrl ?? null, link: link ?? null, authorId: null,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt?.toISOString?.() ?? row.createdAt });
});

router.delete("/panel/feed/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, id));
  res.sendStatus(204);
});

export default router;
