import { Router } from "express";
import { db, feedCommentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import z from "zod";

const router = Router();

const CommentInput = z.object({ content: z.string().min(1).max(2000) });

async function formatComment(c: any) {
  let authorName = "Unknown";
  let authorDisplayName: string | null = null;
  let authorAvatar: string | null = null;
  let authorRole = "NEW_MEMBER";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, c.authorId));
  if (user) {
    authorName = user.username;
    authorDisplayName = user.displayName ?? null;
    authorAvatar = user.avatarUrl ?? null;
    authorRole = user.role;
  }

  return {
    id: c.id,
    postId: c.postId,
    content: c.content,
    authorId: c.authorId,
    authorName,
    authorDisplayName,
    authorAvatar,
    authorRole,
    createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
  };
}

router.get("/feed/:id/comments", async (req, res): Promise<void> => {
  const postId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(postId)) { res.status(400).json({ error: "Invalid post ID" }); return; }

  const comments = await db.select().from(feedCommentsTable)
    .where(eq(feedCommentsTable.postId, postId))
    .orderBy(feedCommentsTable.createdAt);

  const formatted = await Promise.all(comments.map(formatComment));
  res.json(formatted);
});

router.post("/feed/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const postId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(postId)) { res.status(400).json({ error: "Invalid post ID" }); return; }

  const parsed = CommentInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const authorId = (req.session as any).userId;
  const [comment] = await db.insert(feedCommentsTable).values({
    postId,
    authorId,
    content: parsed.data.content,
  }).returning();

  res.status(201).json(await formatComment(comment));
});

export default router;
