import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `about_background_id` column to `home` global. Optional FK to `media` —
 * the faint full-bleed texture laid over the forest «درباره‌ی ژیک» layer at
 * 10% opacity. When null the storefront falls back to the bundled celine
 * carved-walnut default.
 *
 * Mirrors `about_media_id` (20260605_120000) — same shape, sibling upload
 * field on the Home global.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "home" ADD COLUMN IF NOT EXISTS "about_background_id" integer;
    ALTER TABLE "home" ADD CONSTRAINT "home_about_background_id_media_id_fk" FOREIGN KEY ("about_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "home_about_background_idx" ON "home" USING btree ("about_background_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "home_about_background_idx";
    ALTER TABLE "home" DROP CONSTRAINT IF EXISTS "home_about_background_id_media_id_fk";
    ALTER TABLE "home" DROP COLUMN IF EXISTS "about_background_id";
  `)
}
