import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /bedroom-set/{occupancy} per-hub editor (2026-06-25):
 *   bedroom_set_hubs        → one row per age group. Hero copy/image, intro band,
 *                             designs-section heading + featured_design FK,
 *                             content_body (richText jsonb), cross-link heading,
 *                             SEO meta + og image. `occupancy` is a unique enum.
 *   bedroom_set_hubs_rels   → hasMany design relations (tileOrder, hiddenDesigns)
 *                             distinguished by `path` (mirrors journal_rels).
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * Additive only; never touches designs_occupancies. Single selects are enums
 * (cf. enum_designs_occupancy_media_occupancy); single relations/uploads are FK
 * columns; hasMany relations use the _rels table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_bedroom_set_hubs_occupancy" AS ENUM('baby', 'teen', 'double', 'bunk');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "bedroom_set_hubs" (
      "id" serial PRIMARY KEY NOT NULL,
      "occupancy" "enum_bedroom_set_hubs_occupancy" NOT NULL,
      "hero_image_id" integer,
      "hero_title" varchar,
      "hero_tagline" varchar,
      "hero_cta_label" varchar,
      "hero_cta_href" varchar,
      "intro_heading" varchar,
      "intro_body" varchar,
      "designs_heading" varchar,
      "featured_design_id" integer,
      "content_body" jsonb,
      "cross_links_heading" varchar,
      "seo_title" varchar,
      "seo_description" varchar,
      "seo_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_set_hubs" ADD CONSTRAINT "bedroom_set_hubs_hero_image_id_media_id_fk"
        FOREIGN KEY ("hero_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "bedroom_set_hubs" ADD CONSTRAINT "bedroom_set_hubs_featured_design_id_designs_id_fk"
        FOREIGN KEY ("featured_design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "bedroom_set_hubs" ADD CONSTRAINT "bedroom_set_hubs_seo_image_id_media_id_fk"
        FOREIGN KEY ("seo_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "bedroom_set_hubs_occupancy_idx" ON "bedroom_set_hubs" USING btree ("occupancy");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_hero_image_idx" ON "bedroom_set_hubs" USING btree ("hero_image_id");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_featured_design_idx" ON "bedroom_set_hubs" USING btree ("featured_design_id");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_seo_image_idx" ON "bedroom_set_hubs" USING btree ("seo_image_id");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_updated_at_idx" ON "bedroom_set_hubs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_created_at_idx" ON "bedroom_set_hubs" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "bedroom_set_hubs_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "designs_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_set_hubs_rels" ADD CONSTRAINT "bedroom_set_hubs_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "bedroom_set_hubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "bedroom_set_hubs_rels" ADD CONSTRAINT "bedroom_set_hubs_rels_designs_fk"
        FOREIGN KEY ("designs_id") REFERENCES "designs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_rels_order_idx" ON "bedroom_set_hubs_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_rels_parent_idx" ON "bedroom_set_hubs_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_rels_path_idx" ON "bedroom_set_hubs_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hubs_rels_designs_id_idx" ON "bedroom_set_hubs_rels" USING btree ("designs_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "bedroom_set_hubs_rels";
    DROP TABLE IF EXISTS "bedroom_set_hubs";
    DROP TYPE IF EXISTS "enum_bedroom_set_hubs_occupancy";
  `)
}
