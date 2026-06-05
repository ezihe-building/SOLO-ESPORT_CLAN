import { Router } from "express";
import { db, usersTable, scrimsTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  const sortBy = parsed.success ? (parsed.data.sortBy ?? "clanPoints") : "clanPoints";

  const users = await db.select().from(usersTable).where(eq(usersTable.status, "ACTIVE"));

  const sortFns: Record<string, (a: any, b: any) => number> = {
    clanPoints: (a, b) => b.clanPoints - a.clanPoints,
    kdRatio: (a, b) => b.kdRatio - a.kdRatio,
    mvpCount: (a, b) => b.mvpCount - a.mvpCount,
    activity: (a, b) => b.activity - a.activity,
    scrimWins: (a, b) => b.scrimWins - a.scrimWins,
  };

  const sorted = [...users].sort(sortFns[sortBy] ?? sortFns.clanPoints);

  const entries = sorted.map((user, idx) => ({
    rank: idx + 1,
    userId: user.id,
    username: user.username,
    clanTag: `S²十${user.username}`,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    kills: user.kills,
    wins: user.wins,
    kdRatio: user.kdRatio,
    clanPoints: user.clanPoints,
    mvpCount: user.mvpCount,
    activity: user.activity,
    scrimWins: user.scrimWins,
  }));

  res.json(entries);
});

export default router;
