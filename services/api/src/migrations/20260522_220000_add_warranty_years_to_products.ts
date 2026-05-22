import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `warranty_years` column to `products`. Default 5 to match the
 * existing fallback in `ProductSidebar.tsx`. Nullable so future products
 * can opt out; integer (Persian-digit rendering happens at display time).
 *
 * Closes the "warrantyYears ghost field" issue: the field was referenced
 * in the storefront (PDP InfoCard) but never existed in the schema, so
 * every product silently rendered the `?? 5` default.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "warranty_years" numeric DEFAULT 5;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      DROP COLUMN IF EXISTS "warranty_years";
  `)
}
