import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_rooms_status" AS ENUM('draft', 'published');

    CREATE TABLE "rooms" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL UNIQUE,
      "cover_id" integer,
      "tagline" varchar,
      "long_description" jsonb,
      "status" "enum_rooms_status" DEFAULT 'draft' NOT NULL,
      "published_at" timestamp(3) with time zone,
      "seo_meta_title" varchar,
      "seo_meta_description" varchar,
      "seo_og_image_id" integer,
      "seo_canonical_url" varchar,
      "seo_noindex" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "rooms"
        ADD CONSTRAINT "rooms_cover_id_media_id_fk"
        FOREIGN KEY ("cover_id")
        REFERENCES "media"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "rooms"
        ADD CONSTRAINT "rooms_seo_og_image_id_media_id_fk"
        FOREIGN KEY ("seo_og_image_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX "rooms_slug_idx" ON "rooms" USING BTREE ("slug");
    CREATE INDEX "rooms_status_idx" ON "rooms" USING BTREE ("status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "rooms" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_rooms_status";
  `)
}
