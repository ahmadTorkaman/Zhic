import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Extend enum_products_piece_type with 6 new values needed for the bulk
 * product import from the legacy WooCommerce catalog:
 *   vanity, chair, console, changing_table, bracket, sofa
 *
 * Postgres enums can only be extended (not shrunk), so down() is a no-op
 * with a logged warning. Removing values would require recreating the type.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE enum_products_piece_type ADD VALUE IF NOT EXISTS 'vanity';
    ALTER TYPE enum_products_piece_type ADD VALUE IF NOT EXISTS 'chair';
    ALTER TYPE enum_products_piece_type ADD VALUE IF NOT EXISTS 'console';
    ALTER TYPE enum_products_piece_type ADD VALUE IF NOT EXISTS 'changing_table';
    ALTER TYPE enum_products_piece_type ADD VALUE IF NOT EXISTS 'bracket';
    ALTER TYPE enum_products_piece_type ADD VALUE IF NOT EXISTS 'sofa';
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing enum values without recreating the
  // type. To revert, recreate enum_products_piece_type with the original 8
  // values and ALTER TABLE products ALTER COLUMN piece_type TYPE ... USING.
  // Not implemented here because no production environment has rolled back.
  console.warn(
    '[migration] down() is a no-op for extend_piece_type_enum — enum value removal requires manual type recreation.',
  )
}
