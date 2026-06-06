import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /bedroom-set SP1 — Payload data wiring (2026-06-06):
 *
 *   designs.logo_media_id          → the design name-mark (logoMedia upload).
 *   designs_occupancy_media table  → per-room-type card variants (occupancyMedia
 *                                    array of { occupancy(select), image(upload) }).
 *   bedroom_set global table       → the hub's writing-section copy.
 *
 * Hand-written rather than `migrate:create`d: the auto-diff prompts to "rename"
 * the manually-created designs_occupancies select table (see
 * 20260523_120000_add_occupancies_and_axis_filter.ts — its snapshot was never
 * recorded), which hangs under no-TTY. This migration adds ONLY the new objects
 * and never touches designs_occupancies. Single selects are enums here
 * (cf. enum_designs_age_group); arrays use _order / _parent_id / varchar id.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) Designs.logoMedia (upload → media)
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "logo_media_id" integer;
    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_logo_media_id_media_id_fk"
        FOREIGN KEY ("logo_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- 2) Designs.occupancyMedia (array of { occupancy(select), image(upload) })
    DO $$ BEGIN
      CREATE TYPE "enum_designs_occupancy_media_occupancy" AS ENUM('baby', 'teen', 'double', 'bunk');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "designs_occupancy_media" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "occupancy" "enum_designs_occupancy_media_occupancy" NOT NULL,
      "image_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "designs_occupancy_media"
        ADD CONSTRAINT "designs_occupancy_media_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "designs"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "designs_occupancy_media"
        ADD CONSTRAINT "designs_occupancy_media_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "designs_occupancy_media_order_idx"
      ON "designs_occupancy_media" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "designs_occupancy_media_parent_id_idx"
      ON "designs_occupancy_media" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "designs_occupancy_media_image_idx"
      ON "designs_occupancy_media" USING btree ("image_id");

    -- 3) bedroom-set global (writing-section copy)
    CREATE TABLE IF NOT EXISTS "bedroom_set" (
      "id" serial PRIMARY KEY NOT NULL,
      "writing_heading" varchar,
      "writing_body" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "bedroom_set";
    DROP TABLE IF EXISTS "designs_occupancy_media";
    DROP TYPE IF EXISTS "enum_designs_occupancy_media_occupancy";
    ALTER TABLE "designs"
      DROP CONSTRAINT IF EXISTS "designs_logo_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "logo_media_id";
  `)
}
