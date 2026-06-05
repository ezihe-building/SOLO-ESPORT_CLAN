import { Router } from "express";
import { db, usersTable, scrimsTable, announcementsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const allUsers = await db.select().from(usersTable).where(eq(usersTable.status, "ACTIVE"));
  const activeMembers = allUsers.length;

  const totalScrimWins = allUsers.reduce((sum, u) => sum + u.scrimWins, 0);
  const avgKd = allUsers.length > 0
    ? Math.round((allUsers.reduce((sum, u) => sum + u.kdRatio, 0) / allUsers.length) * 100) / 100
    : 0;

  const allScrims = await db.select().from(scrimsTable);
  const upcomingScrims = allScrims.filter(s => s.status === "UPCOMING").length;

  const allAnnouncements = await db.select().from(announcementsTable);
  const recentAnnouncements = allAnnouncements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      imageUrl: a.imageUrl ?? null,
      link: a.link ?? null,
      isPinned: a.isPinned,
      authorId: a.authorId ?? null,
      authorName: null,
      createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
      updatedAt: a.updatedAt?.toISOString?.() ?? a.updatedAt,
    }));

  const upcomingScrimsList = allScrims
    .filter(s => s.status === "UPCOMING")
    .slice(0, 5)
    .map(s => ({
      id: s.id,
      title: s.title,
      description: s.description ?? null,
      imageUrl: s.imageUrl ?? null,
      link: s.link ?? null,
      scheduledAt: s.scheduledAt ?? null,
      status: s.status,
      result: s.result ?? null,
      participants: [],
      createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
    }));

  res.json({
    activeMembers,
    scrimWins: totalScrimWins,
    avgKd,
    upcomingScrims,
    recentAnnouncements,
    upcomingScrimsList,
  });
});

export default router;
