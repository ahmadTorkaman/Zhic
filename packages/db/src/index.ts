/**
 * @zhic/db — Postgres schema, migrations, shared client.
 *
 * Payload 3 (services/api) manages its own tables via @payloadcms/db-postgres
 * and does NOT use this package. Payload generates its own migrations internally.
 *
 * This package is reserved for:
 * - Future Drizzle schemas (MES, ERP) — Package 4
 * - Cross-service read models (Package 3+)
 *
 * Nothing to export in Month 1.
 */
export {}
