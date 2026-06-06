import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

router.post("/panel/auth", (req, res): void => {
  const { password } = req.body;
  if (password !== PANEL_PASSWORD) {
    res.status(403).json({ error: "Wrong password" });
    return;
  }
  res.json({ ok: true });
});

router.get("/panel/members", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;
  const users = await db.select().from(usersTable).orderBy(usersTable.joinedAt);
  res.json(users.map(formatUser));
});

router.patch("/panel/members/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const {
    role, status,
    kills, deaths, wins, losses,
    clanPoints, mvpCount, scrimWins, activity, tournamentWins,
  } = req.body;

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

  // Auto K/D
  if (updates.kills !== undefined || updates.deaths !== undefined) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (existing) {
      const k = updates.kills ?? existing.kills;
      const d = updates.deaths ?? existing.deaths;
      updates.kdRatio = d > 0 ? Math.round((k / d) * 100) / 100 : k;
    }
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.delete("/panel/members/:id", async (req, res): Promise<void> => {
  if (!verifyPanel(req, res)) return;

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

export default router;
