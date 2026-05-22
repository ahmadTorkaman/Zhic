import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      ADD COLUMN IF NOT EXISTS "product_variant_id" integer,
      ADD COLUMN IF NOT EXISTS "selected_axes" jsonb;

    DO $$ BEGIN
      ALTER TABLE "inquiries"
        ADD CONSTRAINT "inquiries_product_variant_id_fk"
        FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "inquiries_product_variant_id_idx"
      ON "inquiries" USING btree ("product_variant_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "inquiries"
      DROP CONSTRAINT IF EXISTS "inquiries_product_variant_id_fk",
      DROP COLUMN IF EXISTS "product_variant_id",
      DROP COLUMN IF EXISTS "selected_axes";
  `)
}
