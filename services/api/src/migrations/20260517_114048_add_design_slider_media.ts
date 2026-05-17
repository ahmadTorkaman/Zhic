import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add slider_media_id column + FK on designs.
 * Mirrors the heroMedia FK shape from the earlier editorial-fields migration.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "slider_media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_slider_media_id_media_id_fk"
        FOREIGN KEY ("slider_media_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "designs"
      DROP CONSTRAINT IF EXISTS "designs_slider_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "slider_media_id";
  `)
}
