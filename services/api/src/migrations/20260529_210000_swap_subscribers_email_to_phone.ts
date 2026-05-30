import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Newsletter signup swaps email → phone (CEO directive 2026-05-29).
 *
 * The Subscribers collection's required+unique field changes from `email` to
 * `phone` (Iranian mobile, canonical form 09xxxxxxxxx). The `/api/newsletter`
 * route normalizes user input (Persian/Arabic digits, +98 prefix, missing
 * leading zero) before persisting, so the column only ever stores the
 * canonical form.
 *
 * Existing rows are truncated — the user explicitly accepted "drop email
 * entirely, irreversible if rows exist" when picking this approach. We can't
 * keep rows with NULL phone given phone is NOT NULL + UNIQUE.
 *
 * Note: hand-written rather than auto-generated. Payload's `migrate:create`
 * went interactive on an unrelated table this session and couldn't be driven
 * non-interactively from the agent's shell.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "subscribers_email_idx";

    TRUNCATE TABLE "subscribers" RESTART IDENTITY CASCADE;

    ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "email";

    ALTER TABLE "subscribers" ADD COLUMN "phone" varchar NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_phone_idx"
      ON "subscribers" USING btree ("phone");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "subscribers_phone_idx";

    TRUNCATE TABLE "subscribers" RESTART IDENTITY CASCADE;

    ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "phone";

    ALTER TABLE "subscribers" ADD COLUMN "email" varchar NOT NULL UNIQUE;

    CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_email_idx"
      ON "subscribers" USING btree ("email");
  `)
}
