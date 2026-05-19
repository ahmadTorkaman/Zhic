import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_site_config_socials_platform" AS ENUM(
        'instagram', 'telegram', 'whatsapp', 'aparat', 'youtube', 'linkedin', 'pinterest'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "site_config" (
      "id" serial PRIMARY KEY NOT NULL,
      "contact_phone" varchar,
      "contact_email" varchar,
      "address" jsonb,
      "hours" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "site_config_socials" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "platform" "enum_site_config_socials_platform" NOT NULL,
      "url" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "home_hero_slides" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "alt" varchar,
      "link" varchar
    );

    CREATE TABLE IF NOT EXISTS "subscribers" (
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL UNIQUE,
      "subscribed_at" timestamp(3) with time zone NOT NULL,
      "source" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "site_config_socials"
        ADD CONSTRAINT "site_config_socials_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."site_config"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "home_hero_slides"
        ADD CONSTRAINT "home_hero_slides_parent_id_fk"
        FOREIGN KEY ("_parent_id")
        REFERENCES "public"."home"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "home_hero_slides"
        ADD CONSTRAINT "home_hero_slides_image_id_media_id_fk"
        FOREIGN KEY ("image_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "site_config_socials_order_idx" ON "site_config_socials" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "site_config_socials_parent_id_idx" ON "site_config_socials" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "site_config_updated_at_idx" ON "site_config" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "site_config_created_at_idx" ON "site_config" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "home_hero_slides_order_idx" ON "home_hero_slides" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "home_hero_slides_parent_id_idx" ON "home_hero_slides" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "home_hero_slides_image_idx" ON "home_hero_slides" USING btree ("image_id");

    CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_email_idx" ON "subscribers" USING btree ("email");
    CREATE INDEX IF NOT EXISTS "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "subscribers" CASCADE;
    DROP TABLE IF EXISTS "home_hero_slides" CASCADE;
    DROP TABLE IF EXISTS "site_config_socials" CASCADE;
    DROP TABLE IF EXISTS "site_config" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_site_config_socials_platform";
  `)
}
