/**
 * Catalog audit batch — STAGE 1: publish live-design drafts + trim product names.
 * Spec: docs/superpowers/specs/2026-06-26-catalog-design-audit-ledger.md
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-15-publish-and-names.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-15-publish-and-names.mts --apply  # write
 *
 * Idempotent. Direct pg (getPayload broken on Node 24 here).
 *
 * S1.1 Publish every DRAFT product that belongs to a LIVE design (a design with ≥1
 *      published product). This is the operator publish policy ("publish price-0 +
 *      imageless products, in live designs only"). The 7 held designs (classic, eliza,
 *      roco, romantic, catherine, general, adrian) have 0 published products → excluded.
 * S1.2 Trim leading/trailing whitespace from product names (fixes «تخت نوزاد دومنظوره پارلا »).
 */
import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8')
  for (const line of env.split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const i = t.indexOf('='); if (i > 0 && !process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
} catch { /* env from process */ }
if (!process.env.DATABASE_URI) { console.error('DATABASE_URI not set'); process.exit(1) }

const APPLY = process.argv.includes('--apply')
const log = (...a: unknown[]) => console.log(...a)

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
await client.connect()

try {
  await client.query('BEGIN')

  // S1.1 — publish drafts in live designs (designs with ≥1 published product)
  const toPublish = await client.query(`
    SELECT p.id, p.name, d.slug AS design
    FROM products p JOIN designs d ON p.design_id = d.id
    WHERE p.status = 'draft'
      AND p.design_id IN (SELECT design_id FROM products WHERE status = 'published')
    ORDER BY d.slug, p.name
  `)
  log(`\n[S1.1] Publish drafts in live designs: ${toPublish.rows.length} products`)
  for (const r of toPublish.rows) log(`   publish  ${r.design.padEnd(11)} #${r.id}  ${r.name}`)

  // held designs (0 published) that we are NOT touching — report for sanity
  const held = await client.query(`
    SELECT d.slug, count(*) AS drafts
    FROM products p JOIN designs d ON p.design_id = d.id
    WHERE p.status = 'draft'
      AND p.design_id NOT IN (SELECT design_id FROM products WHERE status = 'published')
    GROUP BY d.slug ORDER BY d.slug
  `)
  log(`\n[S1.1] Held designs left as draft (NOT published): ${held.rows.map((r) => `${r.slug}(${r.drafts})`).join(', ')}`)

  if (APPLY) {
    await client.query(`
      UPDATE products SET status='published'
      WHERE status='draft'
        AND design_id IN (SELECT design_id FROM products WHERE status='published')
    `)
  }

  // S1.2 — trim whitespace in product names
  const toTrim = await client.query(`SELECT id, name FROM products WHERE name <> btrim(name)`)
  log(`\n[S1.2] Names to trim: ${toTrim.rows.length}`)
  for (const r of toTrim.rows) log(`   trim     #${r.id}  «${r.name}» → «${r.name.trim()}»`)
  if (APPLY) {
    await client.query(`UPDATE products SET name=btrim(name) WHERE name <> btrim(name)`)
  }

  if (APPLY) { await client.query('COMMIT'); log('\n✅ APPLIED (committed).') }
  else { await client.query('ROLLBACK'); log('\n— DRY RUN (no changes). Re-run with --apply to write.') }
} catch (e) {
  await client.query('ROLLBACK'); console.error('ROLLED BACK:', e); process.exitCode = 1
} finally {
  await client.end()
}
