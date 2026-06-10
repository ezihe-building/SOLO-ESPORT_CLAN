import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clanGcChannelsTable = pgTable("clan_gc_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  allowedRoles: text("allowed_roles").notNull().default("ALL"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clanGcMessagesTable = pgTable("clan_gc_messages", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("TEXT"),
  channel: text("channel").notNull().default("GENERAL"),
  replyToId: integer("reply_to_id"),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clanGcReactionsTable = pgTable("clan_gc_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  userId: integer("user_id").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClanGcMessageSchema = createInsertSchema(clanGcMessagesTable).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});
export const insertClanGcChannelSchema = createInsertSchema(clanGcChannelsTable).omit({
  id: true,
  createdAt: true,
});
export const insertClanGcReactionSchema = createInsertSchema(clanGcReactionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertClanGcMessage = z.infer<typeof insertClanGcMessageSchema>;
export type InsertClanGcChannel = z.infer<typeof insertClanGcChannelSchema>;
export type InsertClanGcReaction = z.infer<typeof insertClanGcReactionSchema>;
export type ClanGcMessage = typeof clanGcMessagesTable.$inferSelect;
export type ClanGcChannel = typeof clanGcChannelsTable.$inferSelect;
export type ClanGcReaction = typeof clanGcReactionsTable.$inferSelect;
