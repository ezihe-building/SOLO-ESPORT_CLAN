import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clanGcMessagesTable = pgTable("clan_gc_messages", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("TEXT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClanGcMessageSchema = createInsertSchema(clanGcMessagesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertClanGcMessage = z.infer<typeof insertClanGcMessageSchema>;
export type ClanGcMessage = typeof clanGcMessagesTable.$inferSelect;
