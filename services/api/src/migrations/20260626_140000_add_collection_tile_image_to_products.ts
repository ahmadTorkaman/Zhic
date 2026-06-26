import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `collection_tile_image_id` FK column on `products` — a dedicated single
 * upload for the «قطعات سرویس» seriesCollection tile, independent of `gallery`.
 *
 * Single-upload FK shape mirrors designs.slider_media_id
 * (20260517_114048_add_design_slider_media). Nullable, additive — existing
 * products keep working (frontend falls back to gallery[0]).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "collection_tile_image_id" integer;

    DO $$ BEGIN
      ALTER TABLE "products"
        ADD CONSTRAINT "products_collection_tile_image_id_media_id_fk"
        FOREIGN KEY ("collection_tile_image_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_collection_tile_image_idx"
      ON "products" USING btree ("collection_tile_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "products_collection_tile_image_idx";
    ALTER TABLE "products"
      DROP CONSTRAINT IF EXISTS "products_collection_tile_image_id_media_id_fk",
      DROP COLUMN IF EXISTS "collection_tile_image_id";
  `)
}
