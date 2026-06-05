import { Router } from "express";
import { db, announcementsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireManagement } from "../lib/auth";
import {
  CreateAnnouncementBody,
  UpdateAnnouncementBody,
  UpdateAnnouncementParams,
  DeleteAnnouncementParams,
  PinAnnouncementBody,
  PinAnnouncementParams,
} from "@workspace/api-zod";

const router = Router();

function formatAnnouncement(a: any, authorName?: string | null) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    imageUrl: a.imageUrl ?? null,
    link: a.link ?? null,
    isPinned: a.isPinned,
    authorId: a.authorId ?? null,
    authorName: authorName ?? null,
    createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
    updatedAt: a.updatedAt?.toISOString?.() ?? a.updatedAt,
  };
}

router.get("/announcements", async (req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable)
    .orderBy(announcementsTable.isPinned, announcementsTable.createdAt);

  const authorIds = [...new Set(announcements.filter(a => a.authorId).map(a => a.authorId!))];
  const authors: Record<number, string> = {};
  for (const id of authorIds) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (user) authors[id] = user.username;
  }

  res.json(announcements.map(a => formatAnnouncement(a, a.authorId ? authors[a.authorId] : null)));
});

router.post("/announcements", requireManagement, async (req, res): Promise<void> => {
  const parsed = CreateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const authorId = (req.session as any).userId;
  const [ann] = await db.insert(announcementsTable).values({
    title: parsed.data.title,
    content: parsed.data.content,
    imageUrl: parsed.data.imageUrl ?? null,
    link: parsed.data.link ?? null,
    isPinned: parsed.data.isPinned ?? false,
    authorId,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, authorId));
  res.status(201).json(formatAnnouncement(ann, author?.username));
});

router.patch("/announcements/:id", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAnnouncementParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, any> = {};
  if (parsed.data.title != null) updates.title = parsed.data.title;
  if (parsed.data.content != null) updates.content = parsed.data.content;
  if (parsed.data.imageUrl !== undefined) updates.imageUrl = parsed.data.imageUrl;
  if (parsed.data.link !== undefined) updates.link = parsed.data.link;
  if (parsed.data.isPinned != null) updates.isPinned = parsed.data.isPinned;

  const [ann] = await db.update(announcementsTable).set(updates)
    .where(eq(announcementsTable.id, params.data.id)).returning();

  if (!ann) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json(formatAnnouncement(ann));
});

router.delete("/announcements/:id", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAnnouncementParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(announcementsTable).where(eq(announcementsTable.id, params.data.id));
  res.sendStatus(204);
});

router.patch("/announcements/:id/pin", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = PinAnnouncementParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = PinAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ann] = await db.update(announcementsTable)
    .set({ isPinned: parsed.data.isPinned })
    .where(eq(announcementsTable.id, params.data.id))
    .returning();

  if (!ann) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json(formatAnnouncement(ann));
});

export default router;
