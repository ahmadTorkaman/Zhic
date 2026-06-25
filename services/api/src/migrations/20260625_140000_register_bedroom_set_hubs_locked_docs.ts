import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix: register `bedroom_set_hubs` in `payload_locked_documents_rels`.
 *
 * The original `20260625_120000_create_bedroom_set_hubs` migration created the
 * collection table but omitted the `bedroom_set_hubs_id` column on
 * `payload_locked_documents_rels`. Payload's admin joins that column for EVERY
 * registered collection, so its absence made the admin dashboard / collection
 * lists 500 with `column …bedroom_set_hubs_id does not exist`. Mirrors the
 * locked-docs registration in `20260522_150000_create_product_variants`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "bedroom_set_hubs_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_bedroom_set_hubs_fk"
        FOREIGN KEY ("bedroom_set_hubs_id")
        REFERENCES "bedroom_set_hubs"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bedroom_set_hubs_id_idx"
      ON "payload_locked_documents_rels" USING btree ("bedroom_set_hubs_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bedroom_set_hubs_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_bedroom_set_hubs_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "bedroom_set_hubs_id";
  `)
}
