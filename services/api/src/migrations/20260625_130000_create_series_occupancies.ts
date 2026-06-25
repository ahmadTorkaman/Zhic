import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Create the series_occupancies collection and all dependent tables.
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * Follows the exact conventions of 20260522_150000_create_product_variants.ts
 * and 20260519_041500_create_rooms.ts.
 *
 * Tables created:
 *   series_occupancies            — parent, one row per (design × occupancy)
 *   series_occupancies_material_callouts — array field: materialCallouts
 *   series_occupancies_design_details    — array field: designDetails
 *   series_occupancies_siblings          — array field: siblings
 *   series_occupancies_rels              — hasMany relationship: products
 *
 * payload_locked_documents_rels: adds series_occupancies_id column + FK + index.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── Enums ────────────────────────────────────────────────────────────────
    DO $$ BEGIN
      CREATE TYPE "public"."enum_series_occupancies_occupancy" AS ENUM(
        'baby', 'teen', 'double', 'bunk'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_series_occupancies_status" AS ENUM(
        'draft', 'published'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- ── Parent table ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "series_occupancies" (
      "id"               serial PRIMARY KEY NOT NULL,
      "title"            varchar,
      "design_id"        integer NOT NULL,
      "occupancy"        "enum_series_occupancies_occupancy" NOT NULL,
      "hero_media_id"    integer,
      "subtitle"         varchar,
      "intro_title"      varchar,
      "intro_body"       varchar,
      "intro_media_id"   integer,
      "story_body"       varchar,
      "story_media_id"   integer,
      "status"           "enum_series_occupancies_status" DEFAULT 'draft' NOT NULL,
      "published_at"     timestamp(3) with time zone,
      "seo_meta_title"        varchar,
      "seo_meta_description"  varchar,
      "seo_og_image_id"       integer,
      "seo_canonical_url"     varchar,
      "seo_noindex"           boolean DEFAULT false,
      "updated_at"       timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at"       timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- FKs on parent table
    DO $$ BEGIN
      ALTER TABLE "series_occupancies"
        ADD CONSTRAINT "series_occupancies_design_id_designs_id_fk"
        FOREIGN KEY ("design_id") REFERENCES "designs"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies"
        ADD CONSTRAINT "series_occupancies_hero_media_id_media_id_fk"
        FOREIGN KEY ("hero_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies"
        ADD CONSTRAINT "series_occupancies_intro_media_id_media_id_fk"
        FOREIGN KEY ("intro_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies"
        ADD CONSTRAINT "series_occupancies_story_media_id_media_id_fk"
        FOREIGN KEY ("story_media_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies"
        ADD CONSTRAINT "series_occupancies_seo_og_image_id_media_id_fk"
        FOREIGN KEY ("seo_og_image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Indexes on parent table
    CREATE INDEX IF NOT EXISTS "series_occupancies_design_id_idx"
      ON "series_occupancies" USING btree ("design_id");
    CREATE INDEX IF NOT EXISTS "series_occupancies_status_idx"
      ON "series_occupancies" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "series_occupancies_updated_at_idx"
      ON "series_occupancies" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "series_occupancies_created_at_idx"
      ON "series_occupancies" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "series_occupancies_design_occupancy_idx"
      ON "series_occupancies" USING btree ("design_id", "occupancy");

    -- ── materialCallouts array child table ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "series_occupancies_material_callouts" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY NOT NULL,
      "image_id"   integer NOT NULL,
      "label"      varchar NOT NULL,
      "sub"        varchar
    );

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_material_callouts"
        ADD CONSTRAINT "series_occupancies_material_callouts_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_material_callouts"
        ADD CONSTRAINT "series_occupancies_material_callouts_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "series_occupancies"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "series_occupancies_material_callouts_order_idx"
      ON "series_occupancies_material_callouts" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "series_occupancies_material_callouts_parent_id_idx"
      ON "series_occupancies_material_callouts" USING btree ("_parent_id");

    -- ── designDetails array child table ───────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "series_occupancies_design_details" (
      "_order"      integer NOT NULL,
      "_parent_id"  integer NOT NULL,
      "id"          varchar PRIMARY KEY NOT NULL,
      "image_id"    integer NOT NULL,
      "label"       varchar NOT NULL,
      "description" varchar,
      "span"        numeric DEFAULT 100
    );

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_design_details"
        ADD CONSTRAINT "series_occupancies_design_details_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_design_details"
        ADD CONSTRAINT "series_occupancies_design_details_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "series_occupancies"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "series_occupancies_design_details_order_idx"
      ON "series_occupancies_design_details" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "series_occupancies_design_details_parent_id_idx"
      ON "series_occupancies_design_details" USING btree ("_parent_id");

    -- ── siblings array child table ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "series_occupancies_siblings" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY NOT NULL,
      "image_id"   integer,
      "kicker"     varchar,
      "name"       varchar,
      "link"       varchar
    );

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_siblings"
        ADD CONSTRAINT "series_occupancies_siblings_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_siblings"
        ADD CONSTRAINT "series_occupancies_siblings_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "series_occupancies"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "series_occupancies_siblings_order_idx"
      ON "series_occupancies_siblings" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "series_occupancies_siblings_parent_id_idx"
      ON "series_occupancies_siblings" USING btree ("_parent_id");

    -- ── _rels table for products hasMany relationship ─────────────────────────
    CREATE TABLE IF NOT EXISTS "series_occupancies_rels" (
      "id"          serial PRIMARY KEY NOT NULL,
      "order"       integer,
      "parent_id"   integer NOT NULL,
      "path"        varchar NOT NULL,
      "products_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_rels"
        ADD CONSTRAINT "series_occupancies_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "series_occupancies"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "series_occupancies_rels"
        ADD CONSTRAINT "series_occupancies_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "series_occupancies_rels_order_idx"
      ON "series_occupancies_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "series_occupancies_rels_parent_idx"
      ON "series_occupancies_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "series_occupancies_rels_path_idx"
      ON "series_occupancies_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "series_occupancies_rels_products_id_idx"
      ON "series_occupancies_rels" USING btree ("products_id");

    -- ── payload_locked_documents_rels ────────────────────────────────────────
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "series_occupancies_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_series_occupancies_fk"
        FOREIGN KEY ("series_occupancies_id")
        REFERENCES "series_occupancies"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_series_occupancies_id_idx"
      ON "payload_locked_documents_rels" USING btree ("series_occupancies_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_series_occupancies_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_series_occupancies_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "series_occupancies_id";

    DROP TABLE IF EXISTS "series_occupancies_rels";
    DROP TABLE IF EXISTS "series_occupancies_siblings";
    DROP TABLE IF EXISTS "series_occupancies_design_details";
    DROP TABLE IF EXISTS "series_occupancies_material_callouts";
    DROP TABLE IF EXISTS "series_occupancies";

    DROP TYPE IF EXISTS "public"."enum_series_occupancies_status";
    DROP TYPE IF EXISTS "public"."enum_series_occupancies_occupancy";
  `)
}
