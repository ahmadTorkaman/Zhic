import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Bedroom-set detail page — CMS wiring (2026-06-17):
 *
 *   designs.intro_title / intro_body / intro_media_id  → intro editorial card.
 *   designs.story_body / story_media_id                → design-story card.
 *   designs_material_callouts table                    → 3 circular material
 *                                                        swatches { image, label, sub }.
 *   designs_design_details table                       → 4 design-detail tiles
 *                                                        { image, label, description, span }.
 *
 * Hand-written rather than `migrate:create`d (the auto-diff hangs on the
 * untracked designs_occupancies snapshot drift — see
 * 20260606_120000_add_bedroom_set_fields.ts). Additive only; mirrors the
 * designs_occupancy_media array-table conventions. Never touches designs_occupancies.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) Designs intro/story scalar + media fields
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "intro_title" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "intro_body" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "intro_media_id" integer;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "story_body" varchar;
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "story_media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_intro_media_id_media_id_fk"
        FOREIGN KEY ("intro_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_story_media_id_media_id_fk"
        FOREIGN KEY ("story_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- 2) Designs.materialCallouts (array of { image(upload), label(text), sub(text) })
    CREATE TABLE IF NOT EXISTS "designs_material_callouts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "label" varchar,
      "sub" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "designs_material_callouts"
        ADD CONSTRAINT "designs_material_callouts_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "designs"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "designs_material_callouts"
        ADD CONSTRAINT "designs_material_callouts_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "designs_material_callouts_order_idx"
      ON "designs_material_callouts" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "designs_material_callouts_parent_id_idx"
      ON "designs_material_callouts" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "designs_material_callouts_image_idx"
      ON "designs_material_callouts" USING btree ("image_id");

    -- 3) Designs.designDetails (array of { image(upload), label(text), description(textarea), span(number) })
    CREATE TABLE IF NOT EXISTS "designs_design_details" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "label" varchar,
      "description" varchar,
      "span" numeric
    );

    DO $$ BEGIN
      ALTER TABLE "designs_design_details"
        ADD CONSTRAINT "designs_design_details_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "designs"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "designs_design_details"
        ADD CONSTRAINT "designs_design_details_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "designs_design_details_order_idx"
      ON "designs_design_details" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "designs_design_details_parent_id_idx"
      ON "designs_design_details" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "designs_design_details_image_idx"
      ON "designs_design_details" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "designs_material_callouts";
    DROP TABLE IF EXISTS "designs_design_details";
    ALTER TABLE "designs"
      DROP CONSTRAINT IF EXISTS "designs_intro_media_id_media_id_fk",
      DROP CONSTRAINT IF EXISTS "designs_story_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "intro_title",
      DROP COLUMN IF EXISTS "intro_body",
      DROP COLUMN IF EXISTS "intro_media_id",
      DROP COLUMN IF EXISTS "story_body",
      DROP COLUMN IF EXISTS "story_media_id";
  `)
}
