import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /bedroom-set occupancy-hub editorial + SEO copy (2026-06-25):
 *   bedroom_set_occupancy_hubs array → per age-group { occupancy(select), title,
 *   tagline, body, seoTitle, seoDescription } so the operator/SEO team can edit
 *   the /bedroom-set/{occupancy} hub headings, add a content paragraph, and set
 *   meta title/description from the panel (was hardcoded in occupancy-hub-content
 *   META).
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * Additive only. Mirrors designs_occupancy_media exactly: single select → pg
 * enum; array → _order / _parent_id / varchar id, FK → bedroom_set CASCADE.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_bedroom_set_occupancy_hubs_occupancy" AS ENUM('baby', 'teen', 'double', 'bunk');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "bedroom_set_occupancy_hubs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "occupancy" "enum_bedroom_set_occupancy_hubs_occupancy" NOT NULL,
      "title" varchar,
      "tagline" varchar,
      "body" varchar,
      "seo_title" varchar,
      "seo_description" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_set_occupancy_hubs" ADD CONSTRAINT "bedroom_set_occupancy_hubs_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "bedroom_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_set_occupancy_hubs_order_idx" ON "bedroom_set_occupancy_hubs" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bedroom_set_occupancy_hubs_parent_id_idx" ON "bedroom_set_occupancy_hubs" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "bedroom_set_occupancy_hubs";
    DROP TYPE IF EXISTS "enum_bedroom_set_occupancy_hubs_occupancy";
  `)
}
