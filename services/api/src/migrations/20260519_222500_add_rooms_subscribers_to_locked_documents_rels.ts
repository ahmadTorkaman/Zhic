import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "rooms_id" integer,
      ADD COLUMN IF NOT EXISTS "subscribers_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_rooms_fk"
        FOREIGN KEY ("rooms_id")
        REFERENCES "public"."rooms"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk"
        FOREIGN KEY ("subscribers_id")
        REFERENCES "public"."subscribers"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_rooms_id_idx"
      ON "payload_locked_documents_rels" USING btree ("rooms_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscribers_id_idx"
      ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_rooms_fk",
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscribers_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_rooms_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_subscribers_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "rooms_id",
      DROP COLUMN IF EXISTS "subscribers_id";
  `)
}
