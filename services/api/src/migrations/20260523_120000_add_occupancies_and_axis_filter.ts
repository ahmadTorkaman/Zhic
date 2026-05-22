import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Pre-import schema additions for the IA rework (2026-05-23):
 *
 *   designs.occupancies        → hasMany SELECT → child table `designs_occupancies`
 *                                 with values from { baby, teen, double, bunk }.
 *                                 Drives the 4 NEW occupancy hub pages at
 *                                 /bedroom-set/{slug}.
 *
 *   categories.axis_filter     → jsonb nullable. Shape: { axis: string, value: string }.
 *                                 Set only on the 5 SEO-promoted facet sub-leaves
 *                                 (bed/baby/convertible + 4 wardrobe door-counts).
 *                                 Page renderer auto-applies this filter to the
 *                                 product query.
 *
 * Both fields are nullable / optional — no backfill needed. Existing Categories
 * and Designs rows continue to work unchanged.
 *
 * NOTE on column naming: hasMany SELECT child tables use `parent_id` / `order`
 * (no leading underscore), unlike hasMany TEXT (e.g. categories_allowed_axes
 * which uses `_parent_id` / `_order`). Found the hard way on 2026-05-23 when
 * the runtime SQL `... where "designs_occupancies"."parent_id" = ...` failed
 * against an underscored schema. Match the table to the field type.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "axis_filter" jsonb;

    CREATE TABLE IF NOT EXISTS "designs_occupancies" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "designs_occupancies"
        ADD CONSTRAINT "designs_occupancies_parent_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "designs"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "designs_occupancies_order_idx"
      ON "designs_occupancies" USING btree ("order");

    CREATE INDEX IF NOT EXISTS "designs_occupancies_parent_id_idx"
      ON "designs_occupancies" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "designs_occupancies";

    ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "axis_filter";
  `)
}
