import { Router } from "express";
import { db, clanGcMessagesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import z from "zod";

const router = Router();

const MessageInput = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(["TEXT", "IMAGE", "VOICE"]).default("TEXT"),
});

async function formatMessage(m: any) {
  let authorName = "Unknown";
  let authorDisplayName: string | null = null;
  let authorAvatar: string | null = null;
  let authorRole = "NEW_MEMBER";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, m.authorId));
  if (user) {
    authorName = user.username;
    authorDisplayName = user.displayName ?? null;
    authorAvatar = user.avatarUrl ?? null;
    authorRole = user.role;
  }

  return {
    id: m.id,
    content: m.content,
    type: m.type,
    authorId: m.authorId,
    authorName,
    authorDisplayName,
    authorAvatar,
    authorRole,
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
  };
}

router.get("/clan-gc", requireAuth, async (req, res): Promise<void> => {
  const messages = await db.select().from(clanGcMessagesTable)
    .orderBy(desc(clanGcMessagesTable.createdAt))
    .limit(100);

  const formatted = await Promise.all(messages.map(formatMessage));
  res.json(formatted.reverse());
});

router.post("/clan-gc", requireAuth, async (req, res): Promise<void> => {
  const parsed = MessageInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const authorId = (req.session as any).userId;
  const [message] = await db.insert(clanGcMessagesTable).values({
    authorId,
    content: parsed.data.content,
    type: parsed.data.type,
  }).returning();

  res.status(201).json(await formatMessage(message));
});

export default router;
