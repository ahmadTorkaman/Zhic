import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /bedroom-furniture index — CMS wiring (2026-06-18):
 *   bedroom_furniture table            → hero copy + showcase copy + hero_media FK.
 *   bedroom_furniture_showcase array   → { category(rel→categories), archImage(upload→media) }
 *                                        as category_id + arch_image_id FK columns.
 *   bedroom_furniture_rooms array      → { name, display, image(upload→media), href }.
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * Additive only. Array tables mirror home_hero_slides / designs_occupancy_media
 * (a single relation/upload subfield → FK column on the array table). Never
 * touches designs_occupancies.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "bedroom_furniture" (
      "id" serial PRIMARY KEY NOT NULL,
      "hero_title" varchar,
      "hero_subtitle" varchar,
      "hero_tagline" varchar,
      "hero_cta_label" varchar,
      "hero_cta_href" varchar,
      "hero_media_id" integer,
      "showcase_heading" varchar,
      "showcase_body" varchar,
      "showcase_initial" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture" ADD CONSTRAINT "bedroom_furniture_hero_media_id_media_id_fk"
        FOREIGN KEY ("hero_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_furniture_hero_media_idx" ON "bedroom_furniture" USING btree ("hero_media_id");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_updated_at_idx" ON "bedroom_furniture" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_created_at_idx" ON "bedroom_furniture" USING btree ("created_at");

    CREATE TABLE IF NOT EXISTS "bedroom_furniture_showcase" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "category_id" integer,
      "arch_image_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_showcase" ADD CONSTRAINT "bedroom_furniture_showcase_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "bedroom_furniture"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_showcase" ADD CONSTRAINT "bedroom_furniture_showcase_category_id_categories_id_fk"
        FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_showcase" ADD CONSTRAINT "bedroom_furniture_showcase_arch_image_id_media_id_fk"
        FOREIGN KEY ("arch_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_order_idx" ON "bedroom_furniture_showcase" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_parent_id_idx" ON "bedroom_furniture_showcase" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_category_idx" ON "bedroom_furniture_showcase" USING btree ("category_id");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_showcase_arch_image_idx" ON "bedroom_furniture_showcase" USING btree ("arch_image_id");

    CREATE TABLE IF NOT EXISTS "bedroom_furniture_rooms" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar,
      "display" varchar,
      "image_id" integer,
      "href" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_rooms" ADD CONSTRAINT "bedroom_furniture_rooms_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "bedroom_furniture"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "bedroom_furniture_rooms" ADD CONSTRAINT "bedroom_furniture_rooms_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_furniture_rooms_order_idx" ON "bedroom_furniture_rooms" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_rooms_parent_id_idx" ON "bedroom_furniture_rooms" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "bedroom_furniture_rooms_image_idx" ON "bedroom_furniture_rooms" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "bedroom_furniture_showcase" CASCADE;
    DROP TABLE IF EXISTS "bedroom_furniture_rooms" CASCADE;
    DROP TABLE IF EXISTS "bedroom_furniture" CASCADE;
  `)
}
