import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Create the product_variants table + its axes child table for sub-project
 * C of the products overhaul.
 *
 *   product_variants
 *     id, product_id (FK), sku (unique), label, price_delta_rials,
 *     availability (varchar nullable), image_id (FK → media), display_order
 *
 *   product_variants_axes (child table for the `axes` array field)
 *     id, _order, _parent_id (FK → product_variants), key, value
 *
 * Indexes: (product_id), (product_id, display_order), sku unique,
 * (parent_id, key) on the axes child table for fast variant lookup.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "product_variants" (
      "id" serial PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "sku" varchar NOT NULL,
      "label" varchar,
      "price_delta_rials" bigint DEFAULT 0,
      "availability" varchar,
      "image_id" integer,
      "display_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "product_variants"
        ADD CONSTRAINT "product_variants_sku_unique" UNIQUE ("sku");
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "product_variants"
        ADD CONSTRAINT "product_variants_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "product_variants"
        ADD CONSTRAINT "product_variants_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx"
      ON "product_variants" USING btree ("product_id");

    CREATE INDEX IF NOT EXISTS "product_variants_product_display_idx"
      ON "product_variants" USING btree ("product_id", "display_order");

    CREATE TABLE IF NOT EXISTS "product_variants_axes" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "value" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "product_variants_axes"
        ADD CONSTRAINT "product_variants_axes_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "product_variants"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "product_variants_axes_order_idx"
      ON "product_variants_axes" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "product_variants_axes_parent_id_idx"
      ON "product_variants_axes" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "product_variants_axes_parent_key_idx"
      ON "product_variants_axes" USING btree ("_parent_id", "key");

    -- Register product_variants in Payload's locked-documents relation table
    -- so the admin UI can lock records for concurrent-edit protection.
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "product_variants_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_product_variants_fk"
        FOREIGN KEY ("product_variants_id")
        REFERENCES "product_variants"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_variants_id_idx"
      ON "payload_locked_documents_rels" USING btree ("product_variants_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_variants_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_product_variants_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "product_variants_id";
    DROP TABLE IF EXISTS "product_variants_axes";
    DROP TABLE IF EXISTS "product_variants";
  `)
}
