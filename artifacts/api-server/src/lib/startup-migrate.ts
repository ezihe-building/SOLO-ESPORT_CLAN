import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info("Running startup schema migrations...");

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

    await client.query(`
      ALTER TABLE "feed_posts" ADD COLUMN IF NOT EXISTS "video_url" text;
    `);

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
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "feed_likes" (
        "id" serial PRIMARY KEY,
        "post_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );

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

    logger.info("Startup schema migrations complete.");
  } catch (err) {
    logger.error({ err }, "Startup migration failed — server will NOT start to prevent data corruption");
    throw err;
  } finally {
    client.release();
  }
}
