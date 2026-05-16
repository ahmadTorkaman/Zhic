import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "designs"
      ADD COLUMN IF NOT EXISTS "tagline" varchar,
      ADD COLUMN IF NOT EXISTS "hero_media_id" integer,
      ADD COLUMN IF NOT EXISTS "story_blocks" jsonb;

    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_hero_media_id_media_id_fk"
        FOREIGN KEY ("hero_media_id")
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
      DROP CONSTRAINT IF EXISTS "designs_hero_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "tagline",
      DROP COLUMN IF EXISTS "hero_media_id",
      DROP COLUMN IF EXISTS "story_blocks";
  `)
}
