import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /bedroom-set occupancy-hub hero images (2026-06-21):
 *   bedroom_set.hero_{teen,double,baby,bunk}_media_id → an uploadable full-bleed
 *   hero image per /bedroom-set/{occupancy} hub (rendered with BedroomHero, like
 *   /bedroom-furniture). FK → media, nullable; when unset the hub falls back to
 *   the featured design's cover. Additive only (collapsible-group upload fields
 *   flatten to FK columns on the bedroom_set global table — same shape as
 *   bedroom_furniture.hero_media_id).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bedroom_set" ADD COLUMN IF NOT EXISTS "hero_teen_media_id" integer;
    ALTER TABLE "bedroom_set" ADD COLUMN IF NOT EXISTS "hero_double_media_id" integer;
    ALTER TABLE "bedroom_set" ADD COLUMN IF NOT EXISTS "hero_baby_media_id" integer;
    ALTER TABLE "bedroom_set" ADD COLUMN IF NOT EXISTS "hero_bunk_media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "bedroom_set" ADD CONSTRAINT "bedroom_set_hero_teen_media_id_media_id_fk"
        FOREIGN KEY ("hero_teen_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "bedroom_set" ADD CONSTRAINT "bedroom_set_hero_double_media_id_media_id_fk"
        FOREIGN KEY ("hero_double_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "bedroom_set" ADD CONSTRAINT "bedroom_set_hero_baby_media_id_media_id_fk"
        FOREIGN KEY ("hero_baby_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "bedroom_set" ADD CONSTRAINT "bedroom_set_hero_bunk_media_id_media_id_fk"
        FOREIGN KEY ("hero_bunk_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "bedroom_set_hero_teen_media_idx" ON "bedroom_set" USING btree ("hero_teen_media_id");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hero_double_media_idx" ON "bedroom_set" USING btree ("hero_double_media_id");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hero_baby_media_idx" ON "bedroom_set" USING btree ("hero_baby_media_id");
    CREATE INDEX IF NOT EXISTS "bedroom_set_hero_bunk_media_idx" ON "bedroom_set" USING btree ("hero_bunk_media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bedroom_set" DROP COLUMN IF EXISTS "hero_teen_media_id";
    ALTER TABLE "bedroom_set" DROP COLUMN IF EXISTS "hero_double_media_id";
    ALTER TABLE "bedroom_set" DROP COLUMN IF EXISTS "hero_baby_media_id";
    ALTER TABLE "bedroom_set" DROP COLUMN IF EXISTS "hero_bunk_media_id";
  `)
}
