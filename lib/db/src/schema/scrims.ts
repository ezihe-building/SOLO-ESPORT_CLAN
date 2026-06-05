import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scrimsTable = pgTable("scrims", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  link: text("link"),
  scheduledAt: text("scheduled_at"),
  status: text("status").notNull().default("UPCOMING"),
  result: text("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const scrimParticipantsTable = pgTable("scrim_participants", {
  id: serial("id").primaryKey(),
  scrimId: integer("scrim_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScrimSchema = createInsertSchema(scrimsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScrim = z.infer<typeof insertScrimSchema>;
export type Scrim = typeof scrimsTable.$inferSelect;
