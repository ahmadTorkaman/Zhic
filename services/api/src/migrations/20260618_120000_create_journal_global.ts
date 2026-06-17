import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * /journal index — CMS wiring (2026-06-18):
 *   journal table       → editorial copy (intro/quote/full-list heading/product-CTA)
 *                         + single relationships as FK columns (featured_article_id
 *                         → articles, cta_image_id → media).
 *   journal_rels table  → hasMany relationships: list_articles + card_articles
 *                         (→ articles) and category_tabs (→ journal_categories),
 *                         distinguished by `path`.
 *
 * Hand-written (migrate:create hangs on the untracked designs_occupancies drift).
 * Additive only. Mirrors the home/home_rels global-with-relationships shape from
 * 20260505_233650_initial.ts. Never touches designs_occupancies.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "journal" (
      "id" serial PRIMARY KEY NOT NULL,
      "intro_title" varchar,
      "full_list_heading" varchar,
      "quote_text" varchar,
      "cta_title" varchar,
      "cta_label" varchar,
      "cta_href" varchar,
      "cta_image_id" integer,
      "featured_article_id" integer,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_cta_image_id_media_id_fk"
        FOREIGN KEY ("cta_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "journal" ADD CONSTRAINT "journal_featured_article_id_articles_id_fk"
        FOREIGN KEY ("featured_article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "journal_cta_image_idx" ON "journal" USING btree ("cta_image_id");
    CREATE INDEX IF NOT EXISTS "journal_featured_article_idx" ON "journal" USING btree ("featured_article_id");

    CREATE TABLE IF NOT EXISTS "journal_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "articles_id" integer,
      "journal_categories_id" integer
    );

    DO $$ BEGIN
      ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "journal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_articles_fk"
        FOREIGN KEY ("articles_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "journal_rels" ADD CONSTRAINT "journal_rels_journal_categories_fk"
        FOREIGN KEY ("journal_categories_id") REFERENCES "journal_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "journal_rels_order_idx" ON "journal_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "journal_rels_parent_idx" ON "journal_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "journal_rels_path_idx" ON "journal_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "journal_rels_articles_id_idx" ON "journal_rels" USING btree ("articles_id");
    CREATE INDEX IF NOT EXISTS "journal_rels_journal_categories_id_idx" ON "journal_rels" USING btree ("journal_categories_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "journal_rels";
    DROP TABLE IF EXISTS "journal";
  `)
}
