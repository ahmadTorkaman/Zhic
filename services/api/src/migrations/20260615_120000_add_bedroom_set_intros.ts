import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /bedroom-set intros (2026-06-15):
 *   designs.hub_intro                  → per-design caption under the carousel
 *                                        room-type tabs on the /bedroom-set hub.
 *   bedroom_set.featured_bestsellers_intro → caption under the «پرفروش‌ترین» page grid.
 *   bedroom_set.featured_newest_intro      → caption under the «جدیدترین» page grid.
 * All are `textarea` fields → varchar columns. Additive only.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "hub_intro" varchar;
    ALTER TABLE "bedroom_set" ADD COLUMN IF NOT EXISTS "featured_bestsellers_intro" varchar;
    ALTER TABLE "bedroom_set" ADD COLUMN IF NOT EXISTS "featured_newest_intro" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "designs" DROP COLUMN IF EXISTS "hub_intro";
    ALTER TABLE "bedroom_set" DROP COLUMN IF EXISTS "featured_bestsellers_intro";
    ALTER TABLE "bedroom_set" DROP COLUMN IF EXISTS "featured_newest_intro";
  `)
}
