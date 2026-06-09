import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  email: text("email").unique(),
  whatsapp: text("whatsapp"),
  passwordHash: text("password_hash").notNull(),
  tiktok: text("tiktok"),
  instagram: text("instagram"),
  discord: text("discord"),
  role: text("role").notNull().default("NEW_MEMBER"),
  status: text("status").notNull().default("PENDING"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  kills: integer("kills").notNull().default(0),
  deaths: integer("deaths").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  kdRatio: real("kd_ratio").notNull().default(0),
  clanPoints: integer("clan_points").notNull().default(0),
  mvpCount: integer("mvp_count").notNull().default(0),
  activity: integer("activity").notNull().default(0),
  tournamentWins: integer("tournament_wins").notNull().default(0),
  scrimWins: integer("scrim_wins").notNull().default(0),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
  kills: true,
  deaths: true,
  wins: true,
  losses: true,
  kdRatio: true,
  clanPoints: true,
  mvpCount: true,
  activity: true,
  tournamentWins: true,
  scrimWins: true,
  resetToken: true,
  resetTokenExpiry: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
