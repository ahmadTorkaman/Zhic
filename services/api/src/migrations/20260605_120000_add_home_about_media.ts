import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `about_media_id` column to `home` global. Optional FK to `media` —
 * powers the «از همدان، برای ایران» photo on the homepage. When null the
 * section renders text-only.
 *
 * Mirrors `hero_media_id` (initial migration) — same shape, sibling upload
 * field on the Home global.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home"
      ADD COLUMN IF NOT EXISTS "about_media_id" integer
      REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "home_about_media_idx"
      ON "home" USING btree ("about_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "home_about_media_idx";

    ALTER TABLE "home"
      DROP COLUMN IF EXISTS "about_media_id";
  `)
}
