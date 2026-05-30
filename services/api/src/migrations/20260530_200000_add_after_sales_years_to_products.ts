import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `after_sales_years` column to `products`. Default 5 to match the
 * existing fallback in `ProductSidebar.tsx`. Nullable so future products
 * can opt out; integer (Persian-digit rendering happens at display time).
 *
 * Mirrors `warranty_years` (2026-05-22 migration) — same shape, sibling
 * field on the Products collection. Surfaces as the "خدمات پس از فروش"
 * InfoCard in the PDP sidebar.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "after_sales_years" numeric DEFAULT 5;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      DROP COLUMN IF EXISTS "after_sales_years";
  `)
}
