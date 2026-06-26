import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Publish/SEO surface consistency (audit Issue 4 — option D):
 *
 *  A. designs           — add draft/published `status` + `published_at` + the
 *                         shared `seo` group. Existing 27 rows backfill to
 *                         'published' so nothing disappears; new designs default
 *                         to 'draft' (field-level defaultValue, column default
 *                         dropped after backfill).
 *  B. showrooms         — add the shared `seo` group (additive, all null).
 *  C. bedroom_set_hubs  — convert the bespoke inline SEO (seo_title /
 *                         seo_description / seo_image_id) to the shared `seo`
 *                         group by RENAMING those columns to the canonical
 *                         seo_meta_title / seo_meta_description / seo_og_image_id
 *                         and adding seo_canonical_url + seo_noindex. Data on the
 *                         4 existing hub docs is preserved by the rename.
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * seo column shapes + index/constraint names mirror products/articles/
 * series_occupancies (the canonical seoFields group columns).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── A. designs: status + publishedAt + seo group ─────────────────────────
    DO $$ BEGIN
      CREATE TYPE "public"."enum_designs_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "status" "enum_designs_status" NOT NULL DEFAULT 'published';
    ALTER TABLE "designs" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "seo_meta_title" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "seo_meta_description" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "seo_canonical_url" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean DEFAULT false;
    DO $$ BEGIN
      ALTER TABLE "designs" ADD CONSTRAINT "designs_seo_og_image_id_media_id_fk"
        FOREIGN KEY ("seo_og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "designs_status_idx" ON "designs" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "designs_seo_seo_og_image_idx" ON "designs" USING btree ("seo_og_image_id");

    -- ── B. showrooms: seo group ──────────────────────────────────────────────
    ALTER TABLE "showrooms" ADD COLUMN IF NOT EXISTS "seo_meta_title" varchar;
    ALTER TABLE "showrooms" ADD COLUMN IF NOT EXISTS "seo_meta_description" varchar;
    ALTER TABLE "showrooms" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;
    ALTER TABLE "showrooms" ADD COLUMN IF NOT EXISTS "seo_canonical_url" varchar;
    ALTER TABLE "showrooms" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean DEFAULT false;
    DO $$ BEGIN
      ALTER TABLE "showrooms" ADD CONSTRAINT "showrooms_seo_og_image_id_media_id_fk"
        FOREIGN KEY ("seo_og_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "showrooms_seo_seo_og_image_idx" ON "showrooms" USING btree ("seo_og_image_id");

    -- ── C. bedroom_set_hubs: inline SEO → shared seo group (rename + add) ─────
    ALTER TABLE "bedroom_set_hubs" RENAME COLUMN "seo_title" TO "seo_meta_title";
    ALTER TABLE "bedroom_set_hubs" RENAME COLUMN "seo_description" TO "seo_meta_description";
    ALTER TABLE "bedroom_set_hubs" RENAME COLUMN "seo_image_id" TO "seo_og_image_id";
    ALTER TABLE "bedroom_set_hubs" ADD COLUMN IF NOT EXISTS "seo_canonical_url" varchar;
    ALTER TABLE "bedroom_set_hubs" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean DEFAULT false;
    ALTER INDEX "bedroom_set_hubs_seo_image_idx" RENAME TO "bedroom_set_hubs_seo_seo_og_image_idx";
    ALTER TABLE "bedroom_set_hubs" RENAME CONSTRAINT "bedroom_set_hubs_seo_image_id_media_id_fk" TO "bedroom_set_hubs_seo_og_image_id_media_id_fk";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- ── C. bedroom_set_hubs: shared seo group → inline SEO ───────────────────
    ALTER TABLE "bedroom_set_hubs" RENAME CONSTRAINT "bedroom_set_hubs_seo_og_image_id_media_id_fk" TO "bedroom_set_hubs_seo_image_id_media_id_fk";
    ALTER INDEX "bedroom_set_hubs_seo_seo_og_image_idx" RENAME TO "bedroom_set_hubs_seo_image_idx";
    ALTER TABLE "bedroom_set_hubs" DROP COLUMN IF EXISTS "seo_noindex";
    ALTER TABLE "bedroom_set_hubs" DROP COLUMN IF EXISTS "seo_canonical_url";
    ALTER TABLE "bedroom_set_hubs" RENAME COLUMN "seo_og_image_id" TO "seo_image_id";
    ALTER TABLE "bedroom_set_hubs" RENAME COLUMN "seo_meta_description" TO "seo_description";
    ALTER TABLE "bedroom_set_hubs" RENAME COLUMN "seo_meta_title" TO "seo_title";

    -- ── B. showrooms: drop seo group ─────────────────────────────────────────
    DROP INDEX IF EXISTS "showrooms_seo_seo_og_image_idx";
    ALTER TABLE "showrooms" DROP CONSTRAINT IF EXISTS "showrooms_seo_og_image_id_media_id_fk";
    ALTER TABLE "showrooms" DROP COLUMN IF EXISTS "seo_meta_title";
    ALTER TABLE "showrooms" DROP COLUMN IF EXISTS "seo_meta_description";
    ALTER TABLE "showrooms" DROP COLUMN IF EXISTS "seo_og_image_id";
    ALTER TABLE "showrooms" DROP COLUMN IF EXISTS "seo_canonical_url";
    ALTER TABLE "showrooms" DROP COLUMN IF EXISTS "seo_noindex";

    -- ── A. designs: drop status + publishedAt + seo group ────────────────────
    DROP INDEX IF EXISTS "designs_seo_seo_og_image_idx";
    DROP INDEX IF EXISTS "designs_status_idx";
    ALTER TABLE "designs" DROP CONSTRAINT IF EXISTS "designs_seo_og_image_id_media_id_fk";
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "seo_meta_title";
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "seo_meta_description";
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "seo_og_image_id";
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "seo_canonical_url";
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "seo_noindex";
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "published_at";
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "status";
    DROP TYPE IF EXISTS "public"."enum_designs_status";
  `)
}
