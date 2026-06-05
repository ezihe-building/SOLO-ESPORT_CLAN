import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedPostsTable = pgTable("feed_posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  type: text("type").notNull().default("NEWS"),
  imageUrl: text("image_url"),
  link: text("link"),
  authorId: integer("author_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedLikesTable = pgTable("feed_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedPostSchema = createInsertSchema(feedPostsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;
export type FeedPost = typeof feedPostsTable.$inferSelect;
