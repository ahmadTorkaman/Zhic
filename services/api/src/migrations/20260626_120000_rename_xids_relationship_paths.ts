import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rename the six `xIds`-suffixed hasMany relationship fields to bare plural
 * (Products.categoryIds→categories, tagIds→tags, materialIds→materials,
 * relatedProductIds→relatedProducts, pairsWithProductIds→pairsWithProducts;
 * Articles.tagIds→tags; Showrooms.featuredProductIds→featuredProducts).
 *
 * Payload stores hasMany relationships in a per-collection `<col>_rels` table
 * whose `path` column holds the LITERAL field name. Renaming the field in the
 * collection config therefore requires rewriting those `path` values so the
 * existing rows keep resolving. The `_rels` table SHAPE is unchanged — this is
 * a pure data migration (UPDATE only, no DDL). `path` is a plain varchar with a
 * generic index, so the index tracks the new values automatically.
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "products_rels"  SET "path" = 'categories'        WHERE "path" = 'categoryIds';
    UPDATE "products_rels"  SET "path" = 'tags'              WHERE "path" = 'tagIds';
    UPDATE "products_rels"  SET "path" = 'materials'         WHERE "path" = 'materialIds';
    UPDATE "products_rels"  SET "path" = 'relatedProducts'   WHERE "path" = 'relatedProductIds';
    UPDATE "products_rels"  SET "path" = 'pairsWithProducts' WHERE "path" = 'pairsWithProductIds';
    UPDATE "articles_rels"  SET "path" = 'tags'              WHERE "path" = 'tagIds';
    UPDATE "showrooms_rels" SET "path" = 'featuredProducts'  WHERE "path" = 'featuredProductIds';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "products_rels"  SET "path" = 'categoryIds'          WHERE "path" = 'categories';
    UPDATE "products_rels"  SET "path" = 'tagIds'               WHERE "path" = 'tags';
    UPDATE "products_rels"  SET "path" = 'materialIds'          WHERE "path" = 'materials';
    UPDATE "products_rels"  SET "path" = 'relatedProductIds'    WHERE "path" = 'relatedProducts';
    UPDATE "products_rels"  SET "path" = 'pairsWithProductIds'  WHERE "path" = 'pairsWithProducts';
    UPDATE "articles_rels"  SET "path" = 'tagIds'               WHERE "path" = 'tags';
    UPDATE "showrooms_rels" SET "path" = 'featuredProductIds'   WHERE "path" = 'featuredProducts';
  `)
}
