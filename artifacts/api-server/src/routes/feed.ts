import { Router } from "express";
import { db, feedPostsTable, feedLikesTable, feedCommentsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, isManagement } from "../lib/auth";
import z from "zod";

const router = Router();

const CreateFeedPostInput = z.object({
  content: z.string().min(1).max(5000),
  type: z.string().default("NEWS"),
  imageUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
});

async function formatPost(p: any, userId?: number) {
  const likes = await db.select().from(feedLikesTable).where(eq(feedLikesTable.postId, p.id));
  const isLikedByMe = userId ? likes.some(l => l.userId === userId) : false;

  const commentCountRows = await db.select({ count: sql<number>`count(*)` })
    .from(feedCommentsTable)
    .where(eq(feedCommentsTable.postId, p.id));
  const commentCount = Number(commentCountRows[0]?.count ?? 0);

  let authorName: string | null = null;
  let authorDisplayName: string | null = null;
  let authorAvatar: string | null = null;
  let authorRole: string | null = null;

  if (p.authorId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.authorId));
    if (user) {
      authorName = user.username;
      authorDisplayName = user.displayName ?? null;
      authorAvatar = user.avatarUrl ?? null;
      authorRole = user.role;
    }
  }

  return {
    id: p.id,
    content: p.content,
    type: p.type,
    imageUrl: p.imageUrl ?? null,
    videoUrl: p.videoUrl ?? null,
    link: p.link ?? null,
    authorId: p.authorId ?? null,
    authorName,
    authorDisplayName,
    authorAvatar,
    authorRole,
    likeCount: likes.length,
    isLikedByMe,
    commentCount,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
  };
}

router.get("/feed", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  const posts = await db.select().from(feedPostsTable).orderBy(feedPostsTable.createdAt);
  const formatted = await Promise.all(posts.map(p => formatPost(p, userId)));
  res.json(formatted.reverse());
});

router.post("/feed", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateFeedPostInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const authorId = (req.session as any).userId;
  const [post] = await db.insert(feedPostsTable).values({
    content: parsed.data.content,
    type: parsed.data.type,
    imageUrl: parsed.data.imageUrl ?? null,
    videoUrl: parsed.data.videoUrl ?? null,
    link: parsed.data.link ?? null,
    authorId,
  }).returning();

  res.status(201).json(await formatPost(post, authorId));
});

router.delete("/feed/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const postId = parseInt(raw, 10);
  if (isNaN(postId)) { res.status(400).json({ error: "Invalid post ID" }); return; }

  const userId = (req.session as any).userId;
  const role = (req.session as any).role || "";

  const [post] = await db.select().from(feedPostsTable).where(eq(feedPostsTable.id, postId));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }

  if (post.authorId !== userId && !isManagement(role)) {
    res.status(403).json({ error: "Cannot delete another user's post" });
    return;
  }

  await db.delete(feedLikesTable).where(eq(feedLikesTable.postId, postId));
  await db.delete(feedCommentsTable).where(eq(feedCommentsTable.postId, postId));
  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, postId));
  res.sendStatus(204);
});

router.post("/feed/:id/like", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const postId = parseInt(raw, 10);
  if (isNaN(postId)) { res.status(400).json({ error: "Invalid post ID" }); return; }

  const userId = (req.session as any).userId;
  const existing = await db.select().from(feedLikesTable)
    .where(and(eq(feedLikesTable.postId, postId), eq(feedLikesTable.userId, userId)));

  if (existing.length > 0) {
    await db.delete(feedLikesTable)
      .where(and(eq(feedLikesTable.postId, postId), eq(feedLikesTable.userId, userId)));
  } else {
    await db.insert(feedLikesTable).values({ postId, userId });
  }

  const likes = await db.select().from(feedLikesTable).where(eq(feedLikesTable.postId, postId));
  res.json({ liked: existing.length === 0, likeCount: likes.length });
});

export default router;
