import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `products.occupancy` (hasMany SELECT → child table `products_occupancies`)
 * with values from { baby, teen, double, bunk }. Mirrors the shape of
 * `designs.occupancies` (migration 20260523_120000) — same nullable child
 * table, no backfill needed; existing Products rows continue to work.
 *
 * Drives the `?age=<occupancy>` filter on /bedroom-set/[design-slug] pages,
 * where the user clicks an age card on the slider and the PDP narrows the
 * product grid to pieces tagged for that age.
 *
 * Column naming repeats the lesson from designs_occupancies: hasMany SELECT
 * child tables use bare `parent_id` / `order` (no leading underscore), unlike
 * hasMany TEXT. Match the table to the field type or runtime SQL breaks.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_occupancies" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "products_occupancies"
        ADD CONSTRAINT "products_occupancies_parent_id_fk"
        FOREIGN KEY ("parent_id")
        REFERENCES "products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_occupancies_order_idx"
      ON "products_occupancies" USING btree ("order");

    CREATE INDEX IF NOT EXISTS "products_occupancies_parent_id_idx"
      ON "products_occupancies" USING btree ("parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_occupancies";
  `)
}
