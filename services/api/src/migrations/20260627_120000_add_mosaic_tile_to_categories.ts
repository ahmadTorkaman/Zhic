import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add hub-mosaic tile controls on `categories`:
 *  - `mosaic_tile_image_id` FK → media (single upload), nullable. Mirrors
 *    products.collection_tile_image_id (20260626_140000). Independent of
 *    `cover`; the frontend falls back cover → first product photo when null.
 *  - `mosaic_tile_position` enum (top/center/bottom), nullable. Null == center.
 *
 * Additive, nullable — existing categories keep working unchanged.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "mosaic_tile_image_id" integer;

    DO $$ BEGIN
      ALTER TABLE "categories"
        ADD CONSTRAINT "categories_mosaic_tile_image_id_media_id_fk"
        FOREIGN KEY ("mosaic_tile_image_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "categories_mosaic_tile_image_idx"
      ON "categories" USING btree ("mosaic_tile_image_id");

    DO $$ BEGIN
      CREATE TYPE "public"."enum_categories_mosaic_tile_position"
        AS ENUM('top', 'center', 'bottom');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "mosaic_tile_position"
      "enum_categories_mosaic_tile_position";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_mosaic_tile_image_idx";
    ALTER TABLE "categories"
      DROP CONSTRAINT IF EXISTS "categories_mosaic_tile_image_id_media_id_fk",
      DROP COLUMN IF EXISTS "mosaic_tile_image_id",
      DROP COLUMN IF EXISTS "mosaic_tile_position";
    DROP TYPE IF EXISTS "public"."enum_categories_mosaic_tile_position";
  `)
}
