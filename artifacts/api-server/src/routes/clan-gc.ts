import { Router } from "express";
import { db, clanGcMessagesTable, clanGcReactionsTable, clanGcChannelsTable, usersTable } from "@workspace/db";
import { eq, desc, and, like, or, inArray } from "drizzle-orm";
import { requireAuth, requireManagement, isManagement } from "../lib/auth";
import z from "zod";

const router = Router();

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😭", "👀"];

const CHANNEL_PERMISSIONS: Record<string, string[]> = {
  GENERAL: ["ALL"],
  TIER1: ["TIER1", "MANAGEMENT", "ADMIN", "CLAN_MASTER"],
  TIER2: ["TIER2", "MANAGEMENT", "ADMIN", "CLAN_MASTER"],
  TIER3: ["TIER3", "MANAGEMENT", "ADMIN", "CLAN_MASTER"],
  MANAGEMENT: ["MANAGEMENT", "ADMIN", "CLAN_MASTER"],
};

function canAccessChannel(role: string, channel: string): boolean {
  const allowed = CHANNEL_PERMISSIONS[channel] ?? ["ALL"];
  if (allowed.includes("ALL")) return true;
  return allowed.includes(role);
}

function requireChannelAccess(req: any, res: any, next: any): void {
  const channel = (req.query.channel as string) || (req.body.channel as string) || "GENERAL";
  const role = (req.session as any).role || "NEW_MEMBER";
  if (!canAccessChannel(role, channel)) {
    res.status(403).json({ error: "You do not have access to this channel" });
    return;
  }
  next();
}

const MessageInput = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(["TEXT", "IMAGE", "VOICE"]).default("TEXT"),
  channel: z.string().max(20).default("GENERAL"),
  replyToId: z.number().optional(),
});

const ReactionInput = z.object({
  emoji: z.string().min(1).max(10),
});

const EditInput = z.object({
  content: z.string().min(1).max(5000),
});

async function formatMessage(m: any, reactions?: any[]) {
  let authorName = "Unknown";
  let authorDisplayName: string | null = null;
  let authorAvatar: string | null = null;
  let authorRole = "NEW_MEMBER";
  let authorStats: { kills: number; wins: number; clanPoints: number; joinedAt: string | null } = { kills: 0, wins: 0, clanPoints: 0, joinedAt: null };

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, m.authorId));
  if (user) {
    authorName = user.username;
    authorDisplayName = user.displayName ?? null;
    authorAvatar = user.avatarUrl ?? null;
    authorRole = user.role;
    authorStats = {
      kills: user.kills,
      wins: user.wins,
      clanPoints: user.clanPoints,
      joinedAt: user.joinedAt?.toISOString?.() ?? null,
    };
  }

  return {
    id: m.id,
    content: m.content,
    type: m.type,
    channel: m.channel,
    replyToId: m.replyToId,
    editedAt: m.editedAt?.toISOString?.() ?? null,
    isPinned: m.isPinned,
    authorId: m.authorId,
    authorName,
    authorDisplayName,
    authorAvatar,
    authorRole,
    authorStats,
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    reactions: reactions ?? [],
  };
}

async function fetchReactionsForMessages(messageIds: number[]) {
  if (messageIds.length === 0) return {};
  const rows = await db.select().from(clanGcReactionsTable).where(inArray(clanGcReactionsTable.messageId, messageIds));
  const grouped: Record<number, { emoji: string; userIds: number[]; count: number }[]> = {};
  for (const row of rows) {
    const mid = row.messageId;
    if (!grouped[mid]) grouped[mid] = [];
    const existing = grouped[mid].find(r => r.emoji === row.emoji);
    if (existing) {
      existing.userIds.push(row.userId);
      existing.count++;
    } else {
      grouped[mid].push({ emoji: row.emoji, userIds: [row.userId], count: 1 });
    }
  }
  return grouped;
}

// GET /api/clan-gc?channel=GENERAL
router.get("/clan-gc", requireAuth, requireChannelAccess, async (req, res): Promise<void> => {
  const channel = (req.query.channel as string) || "GENERAL";
  const messages = await db.select().from(clanGcMessagesTable)
    .where(eq(clanGcMessagesTable.channel, channel))
    .orderBy(desc(clanGcMessagesTable.createdAt))
    .limit(200);

  const messageIds = messages.map(m => m.id);
  const reactionsMap = await fetchReactionsForMessages(messageIds);

  const formatted = await Promise.all(messages.map(m => formatMessage(m, reactionsMap[m.id] || [])));
  res.json(formatted.reverse());
});

// GET /api/clan-gc/search?q=hello
router.get("/clan-gc/search", requireAuth, async (req, res): Promise<void> => {
  const q = (req.query.q as string || "").trim();
  const channel = (req.query.channel as string) || "GENERAL";
  const role = (req.session as any).role || "NEW_MEMBER";
  if (!canAccessChannel(role, channel)) {
    res.status(403).json({ error: "Access denied" }); return;
  }

  if (!q) { res.json([]); return; }

  const messages = await db.select().from(clanGcMessagesTable)
    .where(
      and(
        eq(clanGcMessagesTable.channel, channel),
        like(clanGcMessagesTable.content, `%${q}%`)
      )
    )
    .orderBy(desc(clanGcMessagesTable.createdAt))
    .limit(50);

  const messageIds = messages.map(m => m.id);
  const reactionsMap = await fetchReactionsForMessages(messageIds);

  const formatted = await Promise.all(messages.map(m => formatMessage(m, reactionsMap[m.id] || [])));
  res.json(formatted.reverse());
});

// GET /api/clan-gc/users
router.get("/clan-gc/users", requireAuth, async (req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    avatarUrl: usersTable.avatarUrl,
    role: usersTable.role,
  }).from(usersTable).where(eq(usersTable.status, "APPROVED"));
  res.json(users);
});

// GET /api/clan-gc/channels
router.get("/clan-gc/channels", requireAuth, async (req, res): Promise<void> => {
  const role = (req.session as any).role || "NEW_MEMBER";
  const allChannels = await db.select().from(clanGcChannelsTable);
  const accessible = allChannels.filter(ch => {
    const roles = ch.allowedRoles.split(",");
    if (roles.includes("ALL")) return true;
    return roles.includes(role);
  });
  res.json(accessible);
});

// GET /api/clan-gc/pinned?channel=GENERAL
router.get("/clan-gc/pinned", requireAuth, requireChannelAccess, async (req, res): Promise<void> => {
  const channel = (req.query.channel as string) || "GENERAL";
  const messages = await db.select().from(clanGcMessagesTable)
    .where(and(eq(clanGcMessagesTable.channel, channel), eq(clanGcMessagesTable.isPinned, true)))
    .orderBy(desc(clanGcMessagesTable.createdAt))
    .limit(20);

  const messageIds = messages.map(m => m.id);
  const reactionsMap = await fetchReactionsForMessages(messageIds);

  const formatted = await Promise.all(messages.map(m => formatMessage(m, reactionsMap[m.id] || [])));
  res.json(formatted.reverse());
});

// POST /api/clan-gc
router.post("/clan-gc", requireAuth, requireChannelAccess, async (req, res): Promise<void> => {
  const parsed = MessageInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const authorId = (req.session as any).userId;
  const role = (req.session as any).role || "NEW_MEMBER";
  const channel = parsed.data.channel.toUpperCase();

  if (!canAccessChannel(role, channel)) {
    res.status(403).json({ error: "You do not have access to this channel" }); return;
  }

  const [message] = await db.insert(clanGcMessagesTable).values({
    authorId,
    content: parsed.data.content,
    type: parsed.data.type,
    channel,
    replyToId: parsed.data.replyToId || null,
  }).returning();

  res.status(201).json(await formatMessage(message));
});

// PATCH /api/clan-gc/:id
router.patch("/clan-gc/:id", requireAuth, async (req, res): Promise<void> => {
  const parsed = EditInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const id = Number(req.params.id);
  const userId = (req.session as any).userId;
  const role = (req.session as any).role || "NEW_MEMBER";

  const [msg] = await db.select().from(clanGcMessagesTable).where(eq(clanGcMessagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }

  if (msg.authorId !== userId && !isManagement(role)) {
    res.status(403).json({ error: "Cannot edit this message" }); return;
  }

  const [updated] = await db.update(clanGcMessagesTable)
    .set({ content: parsed.data.content, editedAt: new Date() })
    .where(eq(clanGcMessagesTable.id, id))
    .returning();

  res.json(await formatMessage(updated));
});

// DELETE /api/clan-gc/:id
router.delete("/clan-gc/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const userId = (req.session as any).userId;
  const role = (req.session as any).role || "NEW_MEMBER";

  const [msg] = await db.select().from(clanGcMessagesTable).where(eq(clanGcMessagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }

  if (msg.authorId !== userId && !isManagement(role)) {
    res.status(403).json({ error: "Cannot delete this message" }); return;
  }

  await db.delete(clanGcReactionsTable).where(eq(clanGcReactionsTable.messageId, id));
  await db.delete(clanGcMessagesTable).where(eq(clanGcMessagesTable.id, id));
  res.json({ success: true });
});

// POST /api/clan-gc/:id/react
router.post("/clan-gc/:id/react", requireAuth, async (req, res): Promise<void> => {
  const parsed = ReactionInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!EMOJIS.includes(parsed.data.emoji)) { res.status(400).json({ error: "Invalid emoji" }); return; }

  const messageId = Number(req.params.id);
  const userId = (req.session as any).userId;

  const [msg] = await db.select().from(clanGcMessagesTable).where(eq(clanGcMessagesTable.id, messageId));
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }

  // Remove existing reaction from this user with this emoji
  await db.delete(clanGcReactionsTable).where(
    and(
      eq(clanGcReactionsTable.messageId, messageId),
      eq(clanGcReactionsTable.userId, userId),
      eq(clanGcReactionsTable.emoji, parsed.data.emoji)
    )
  );

  // Add new reaction
  const [reaction] = await db.insert(clanGcReactionsTable).values({
    messageId,
    userId,
    emoji: parsed.data.emoji,
  }).returning();

  res.status(201).json(reaction);
});

// DELETE /api/clan-gc/:id/react?emoji=👍
router.delete("/clan-gc/:id/react", requireAuth, async (req, res): Promise<void> => {
  const messageId = Number(req.params.id);
  const userId = (req.session as any).userId;
  const emoji = req.query.emoji as string;

  if (!emoji) { res.status(400).json({ error: "Emoji required" }); return; }

  await db.delete(clanGcReactionsTable).where(
    and(
      eq(clanGcReactionsTable.messageId, messageId),
      eq(clanGcReactionsTable.userId, userId),
      eq(clanGcReactionsTable.emoji, emoji)
    )
  );

  res.json({ success: true });
});

// POST /api/clan-gc/:id/pin
router.post("/clan-gc/:id/pin", requireAuth, requireManagement, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [msg] = await db.select().from(clanGcMessagesTable).where(eq(clanGcMessagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }

  const [updated] = await db.update(clanGcMessagesTable)
    .set({ isPinned: true })
    .where(eq(clanGcMessagesTable.id, id))
    .returning();

  res.json(await formatMessage(updated));
});

// POST /api/clan-gc/:id/unpin
router.post("/clan-gc/:id/unpin", requireAuth, requireManagement, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [msg] = await db.select().from(clanGcMessagesTable).where(eq(clanGcMessagesTable.id, id));
  if (!msg) { res.status(404).json({ error: "Message not found" }); return; }

  const [updated] = await db.update(clanGcMessagesTable)
    .set({ isPinned: false })
    .where(eq(clanGcMessagesTable.id, id))
    .returning();

  res.json(await formatMessage(updated));
});

export default router;
