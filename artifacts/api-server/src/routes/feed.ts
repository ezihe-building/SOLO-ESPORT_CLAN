import { Router } from "express";
import { db, feedPostsTable, feedLikesTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireManagement } from "../lib/auth";
import {
  CreateFeedPostBody,
  DeleteFeedPostParams,
  LikeFeedPostParams,
} from "@workspace/api-zod";

const router = Router();

async function formatPost(p: any, userId?: number) {
  const likes = await db.select().from(feedLikesTable).where(eq(feedLikesTable.postId, p.id));
  const isLikedByMe = userId ? likes.some(l => l.userId === userId) : false;

  let authorName: string | null = null;
  let authorAvatar: string | null = null;
  if (p.authorId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.authorId));
    if (user) {
      authorName = user.username;
      authorAvatar = user.avatarUrl ?? null;
    }
  }

  return {
    id: p.id,
    content: p.content,
    type: p.type,
    imageUrl: p.imageUrl ?? null,
    link: p.link ?? null,
    authorId: p.authorId ?? null,
    authorName,
    authorAvatar,
    likeCount: likes.length,
    isLikedByMe,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
  };
}

router.get("/feed", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  const posts = await db.select().from(feedPostsTable).orderBy(feedPostsTable.createdAt);
  const formatted = await Promise.all(posts.map(p => formatPost(p, userId)));
  res.json(formatted.reverse());
});

router.post("/feed", requireManagement, async (req, res): Promise<void> => {
  const parsed = CreateFeedPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const authorId = (req.session as any).userId;
  const [post] = await db.insert(feedPostsTable).values({
    content: parsed.data.content,
    type: parsed.data.type,
    imageUrl: parsed.data.imageUrl ?? null,
    link: parsed.data.link ?? null,
    authorId,
  }).returning();

  res.status(201).json(await formatPost(post, authorId));
});

router.delete("/feed/:id", requireManagement, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFeedPostParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(feedLikesTable).where(eq(feedLikesTable.postId, params.data.id));
  await db.delete(feedPostsTable).where(eq(feedPostsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/feed/:id/like", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LikeFeedPostParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req.session as any).userId;
  const existing = await db.select().from(feedLikesTable)
    .where(and(eq(feedLikesTable.postId, params.data.id), eq(feedLikesTable.userId, userId)));

  if (existing.length > 0) {
    await db.delete(feedLikesTable)
      .where(and(eq(feedLikesTable.postId, params.data.id), eq(feedLikesTable.userId, userId)));
  } else {
    await db.insert(feedLikesTable).values({ postId: params.data.id, userId });
  }

  const likes = await db.select().from(feedLikesTable).where(eq(feedLikesTable.postId, params.data.id));
  res.json({ liked: existing.length === 0, likeCount: likes.length });
});

export default router;
