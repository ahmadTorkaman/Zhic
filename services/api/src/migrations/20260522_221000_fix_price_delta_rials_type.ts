import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Convert `product_variants.price_delta_rials` from `bigint` to `integer`.
 *
 * Why: the Payload collection declares this as `type: 'number'` but the
 * original migration created the column as `bigint`. Drizzle returns bigint
 * as a JavaScript STRING by default, which breaks arithmetic on the PDP
 * (`basePriceRials + priceDeltaRials` would concatenate, not add). The
 * full rial range used in Zhic (base prices <500M, deltas <100M) fits in
 * postgres `integer` (signed 32-bit, max ~2.1B).
 *
 * Conversion is lossless: USING price_delta_rials::integer. If any existing
 * value exceeds INTEGER's range, the migration will throw — that's the
 * intended signal to investigate before continuing.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "product_variants"
      ALTER COLUMN "price_delta_rials" TYPE integer
      USING "price_delta_rials"::integer;
    ALTER TABLE "product_variants"
      ALTER COLUMN "price_delta_rials" SET DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "product_variants"
      ALTER COLUMN "price_delta_rials" TYPE bigint
      USING "price_delta_rials"::bigint;
    ALTER TABLE "product_variants"
      ALTER COLUMN "price_delta_rials" SET DEFAULT 0;
  `)
}
