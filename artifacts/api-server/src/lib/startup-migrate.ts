import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info("Running startup schema migrations...");

    // 1. Create users table FIRST (base table for everything)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "username" text NOT NULL UNIQUE,
        "display_name" text,
        "email" text UNIQUE,
        "whatsapp" text,
        "password_hash" text NOT NULL,
        "tiktok" text,
        "instagram" text,
        "discord" text,
        "role" text NOT NULL DEFAULT 'NEW_MEMBER',
        "status" text NOT NULL DEFAULT 'PENDING',
        "bio" text,
        "avatar_url" text,
        "kills" integer NOT NULL DEFAULT 0,
        "deaths" integer NOT NULL DEFAULT 0,
        "wins" integer NOT NULL DEFAULT 0,
        "losses" integer NOT NULL DEFAULT 0,
        "kd_ratio" real NOT NULL DEFAULT 0,
        "clan_points" integer NOT NULL DEFAULT 0,
        "mvp_count" integer NOT NULL DEFAULT 0,
        "activity" integer NOT NULL DEFAULT 0,
        "tournament_wins" integer NOT NULL DEFAULT 0,
        "scrim_wins" integer NOT NULL DEFAULT 0,
        "reset_token" text,
        "reset_token_expiry" timestamptz,
        "joined_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    logger.info("Users table created/verified.");

    // 2. Add any missing columns to users (safe for existing DBs)
    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tiktok" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "instagram" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "discord" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kills" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deaths" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wins" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "losses" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kd_ratio" real NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clan_points" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mvp_count" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activity" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tournament_wins" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scrim_wins" integer NOT NULL DEFAULT 0;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" text;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" timestamptz;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();
    `);
    logger.info("Users columns updated.");

    // 3. Create feed_posts table (must exist before ALTER)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "feed_posts" (
        "id" serial PRIMARY KEY,
        "content" text NOT NULL,
        "type" text NOT NULL DEFAULT 'NEWS',
        "image_url" text,
        "video_url" text,
        "link" text,
        "author_id" integer,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    logger.info("Feed posts table created/verified.");

    // 4. Add missing columns to feed_posts
    await client.query(`
      ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "video_url" text;
    `);

    // 5. Create all other tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "feed_comments" (
        "id" serial PRIMARY KEY,
        "post_id" integer NOT NULL,
        "author_id" integer NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "clan_gc_messages" (
        "id" serial PRIMARY KEY,
        "author_id" integer NOT NULL,
        "content" text NOT NULL,
        "type" text NOT NULL DEFAULT 'TEXT',
        "channel" text NOT NULL DEFAULT 'GENERAL',
        "reply_to_id" integer,
        "edited_at" timestamptz,
        "is_pinned" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "clan_gc_reactions" (
        "id" serial PRIMARY KEY,
        "message_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "emoji" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "clan_gc_channels" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "allowed_roles" text NOT NULL DEFAULT 'ALL',
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "feed_likes" (
        "id" serial PRIMARY KEY,
        "post_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "content" text NOT NULL,
        "image_url" text,
        "link" text,
        "is_pinned" boolean NOT NULL DEFAULT false,
        "author_id" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "events" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "image_url" text,
        "link" text,
        "event_date" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "scrims" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "description" text,
        "image_url" text,
        "link" text,
        "scheduled_at" text,
        "status" text NOT NULL DEFAULT 'UPCOMING',
        "result" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "scrim_participants" (
        "id" serial PRIMARY KEY,
        "scrim_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "joined_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 6. Add missing columns to existing clan_gc_messages table
    await client.query(`
      ALTER TABLE "clan_gc_messages" ADD COLUMN IF NOT EXISTS "channel" text NOT NULL DEFAULT 'GENERAL';
      ALTER TABLE "clan_gc_messages" ADD COLUMN IF NOT EXISTS "reply_to_id" integer;
      ALTER TABLE "clan_gc_messages" ADD COLUMN IF NOT EXISTS "edited_at" timestamptz;
      ALTER TABLE "clan_gc_messages" ADD COLUMN IF NOT EXISTS "is_pinned" boolean NOT NULL DEFAULT false;
    `);
    logger.info("Clan GC messages columns updated.");

    // 7. Seed default channels if none exist
    await client.query(`
      INSERT INTO "clan_gc_channels" ("name", "slug", "allowed_roles") VALUES
      ('General', 'GENERAL', 'ALL'),
      ('Tier 1', 'TIER1', 'TIER1,MANAGEMENT,CLAN_MASTER'),
      ('Tier 2', 'TIER2', 'TIER2,MANAGEMENT,CLAN_MASTER'),
      ('Tier 3', 'TIER3', 'TIER3,MANAGEMENT,CLAN_MASTER'),
      ('Management', 'MANAGEMENT', 'MANAGEMENT,CLAN_MASTER')
      ON CONFLICT ("slug") DO NOTHING;
    `);
    logger.info("Default channels seeded.");

    logger.info("Startup schema migrations complete.");
  } catch (err) {
    logger.error({ err }, "Startup migration failed — server will NOT start to prevent data corruption");
    throw err;
  } finally {
    client.release();
  }
}
