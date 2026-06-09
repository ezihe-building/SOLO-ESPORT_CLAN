import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, verifyPassword, buildClanTag, requireAuth } from "../lib/auth";
import crypto from "crypto";
import z from "zod";

const router = Router();

const RegisterInput = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  tiktok: z.string().optional(),
  instagram: z.string().optional(),
  discord: z.string().optional(),
});

const LoginInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export function formatUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    clanTag: buildClanTag(user.username),
    email: user.email ?? null,
    whatsapp: user.whatsapp ?? null,
    tiktok: user.tiktok ?? null,
    instagram: user.instagram ?? null,
    discord: user.discord ?? null,
    role: user.role,
    status: user.status,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    kills: user.kills ?? 0,
    deaths: user.deaths ?? 0,
    wins: user.wins ?? 0,
    losses: user.losses ?? 0,
    kdRatio: user.kdRatio ?? 0,
    clanPoints: user.clanPoints ?? 0,
    mvpCount: user.mvpCount ?? 0,
    activity: user.activity ?? 0,
    tournamentWins: user.tournamentWins ?? 0,
    scrimWins: user.scrimWins ?? 0,
    joinedAt: user.joinedAt?.toISOString?.() ?? user.joinedAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(", ") });
    return;
  }

  const { username, email, whatsapp, password, tiktok, instagram, discord } = parsed.data;

  const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  if (email) {
    const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existingEmail.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
  }

  const passwordHash = await hashPassword(password);

  const allUsers = await db.select().from(usersTable);
  const isFirst = allUsers.length === 0;

  const [user] = await db.insert(usersTable).values({
    username,
    email: email || null,
    whatsapp: whatsapp || null,
    passwordHash,
    tiktok: tiktok ?? null,
    instagram: instagram ?? null,
    discord: discord ?? null,
    role: isFirst ? "CLAN_MASTER" : "NEW_MEMBER",
    status: isFirst ? "ACTIVE" : "PENDING",
  }).returning();

  (req.session as any).userId = user.id;
  (req.session as any).role = user.role;

  res.status(201).json({ user: formatUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  (req.session as any).userId = user.id;
  (req.session as any).role = user.role;

  res.json({ user: formatUser(user) });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  (req.session as any).role = user.role;
  res.json(formatUser(user));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.json({ message: "If that email exists, a reset link will be sent" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 1000 * 60 * 60);

  await db.update(usersTable)
    .set({ resetToken: token, resetTokenExpiry: expiry })
    .where(eq(usersTable.id, user.id));

  req.log.info({ token }, "Password reset token generated");
  res.json({ message: "If that email exists, a reset link will be sent" });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "Token and password required" });
    return;
  }

  const now = new Date();
  const [user] = await db.select().from(usersTable).where(
    and(eq(usersTable.resetToken, token), gt(usersTable.resetTokenExpiry!, now))
  );

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.update(usersTable)
    .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Password reset successfully" });
});

export default router;
