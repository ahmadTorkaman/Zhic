import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add five new fields to the categories table for the hub-page rework
 * (sub-project D of the products overhaul).
 *
 *   - tagline       varchar               nullable
 *   - cover_id      integer FK→media.id   nullable (parent-required enforced at hook level)
 *   - intro         jsonb (Lexical)       nullable
 *   - rule          text                  nullable
 *   - allowed_axes  text[]                via Payload's `hasMany: true` → child table
 *
 * Pattern mirrors 20260516_224611_add_design_editorial_fields.ts.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "tagline" varchar,
      ADD COLUMN IF NOT EXISTS "cover_id" integer,
      ADD COLUMN IF NOT EXISTS "intro" jsonb,
      ADD COLUMN IF NOT EXISTS "rule" text;

    DO $$ BEGIN
      ALTER TABLE "categories"
        ADD CONSTRAINT "categories_cover_id_media_id_fk"
        FOREIGN KEY ("cover_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "categories_allowed_axes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "categories_allowed_axes"
        ADD CONSTRAINT "categories_allowed_axes_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "categories"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "categories_allowed_axes_order_idx"
      ON "categories_allowed_axes" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "categories_allowed_axes_parent_id_idx"
      ON "categories_allowed_axes" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "categories_allowed_axes";

    ALTER TABLE "categories"
      DROP CONSTRAINT IF EXISTS "categories_cover_id_media_id_fk",
      DROP COLUMN IF EXISTS "tagline",
      DROP COLUMN IF EXISTS "cover_id",
      DROP COLUMN IF EXISTS "intro",
      DROP COLUMN IF EXISTS "rule";
  `)
}
