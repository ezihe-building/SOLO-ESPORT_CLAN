import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireManagement } from "../lib/auth";
import {
  ApproveMemberParams,
  RejectMemberParams,
  SuspendMemberParams,
  RestoreMemberParams,
  DeleteMemberParams,
  UpdateMemberRoleBody,
} from "@workspace/api-zod";
import { formatUser } from "./auth";

const router = Router();

router.get("/admin/members", requireManagement, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.joinedAt);
  res.json(users.map(formatUser));
});

router.patch("/admin/members/:id/approve", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ApproveMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ status: "ACTIVE" })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/admin/members/:id/reject", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RejectMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ status: "REJECTED" })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/admin/members/:id/suspend", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SuspendMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ status: "SUSPENDED" })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/admin/members/:id/restore", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RestoreMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ status: "ACTIVE" })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.delete("/admin/members/:id/delete", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Can't delete self
  const sessionUserId = (req.session as any).userId;
  if (params.data.id === sessionUserId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.sendStatus(204);
});

router.patch("/admin/members/:id/role", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateMemberRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Keep session in sync if it's the current user
  if ((req.session as any).userId === id) {
    (req.session as any).role = user.role;
  }

  res.json(formatUser(user));
});

router.get("/admin/stats", requireManagement, async (req, res): Promise<void> => {
  const all = await db.select().from(usersTable);

  res.json({
    total: all.length,
    pending: all.filter(u => u.status === "PENDING").length,
    active: all.filter(u => u.status === "ACTIVE").length,
    tier1: all.filter(u => u.role === "TIER1" && u.status === "ACTIVE").length,
    tier2: all.filter(u => u.role === "TIER2" && u.status === "ACTIVE").length,
    tier3: all.filter(u => u.role === "TIER3" && u.status === "ACTIVE").length,
    suspended: all.filter(u => u.status === "SUSPENDED").length,
  });
});

export default router;
