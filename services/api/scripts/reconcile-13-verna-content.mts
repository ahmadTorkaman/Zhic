/**
 * Reconcile verna-series content/wiring (batch, operator-approved 2026-06-21).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-13-verna-content.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-13-verna-content.mts --apply  # write
 *
 * Idempotent. Mirrors reconcile-12 (iron) with verna-specific decisions:
 *   - Publish ONLY verna-vanity (#577) — keep basePriceRials=0 per operator rule.
 *     HOLD verna-console-vanity-mirror (#576): it has 0 gallery images, so
 *     publishing would render blank. Logged in the audit; pending a 3D asset.
 *   - Tags: `modern` (#2) → all 7; `storage` (#3) → wardrobe/nightstand/vanity.
 *   - SEO ogImage: seed from first gallery image when empty (the mirror has no
 *     gallery, so it is auto-skipped).
 *   - Cross-sell: pairsWith (bed↔nightstand, vanity↔console-mirror, desk↔bookcase)
 *     + relatedProductIds (same-series, priority-ordered).
 *   - verna-bed (#572) placeholder images: sizes 90/100 → 120's single shot,
 *     size 140 → 160's double shot (TEMP — real per-size photos pending).
 *
 * Direct pg (getPayload is broken on Node 24 here).
 */

import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8')
  for (const line of env.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > 0 && !process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
} catch { /* env from process */ }
if (!process.env.DATABASE_URI) { console.error('DATABASE_URI not set'); process.exit(1) }

const APPLY = process.argv.includes('--apply')

const VERNA = [
  { id: 572, slug: 'verna-bed', prio: 0 },
  { id: 578, slug: 'verna-wardrobe', prio: 1 },
  { id: 573, slug: 'verna-nightstand', prio: 2 },
  { id: 577, slug: 'verna-vanity', prio: 3 },
  { id: 575, slug: 'verna-study-desk', prio: 4 },
  { id: 571, slug: 'verna-bookcase', prio: 5 },
  { id: 576, slug: 'verna-console-vanity-mirror', prio: 6 },
]
const PUBLISH = [577]                       // vanity only; mirror #576 HELD (no images)
const TAG_MODERN = 2
const TAG_STORAGE = 3
const STORAGE_PRODUCTS = [578, 573, 577]    // wardrobe, nightstand, vanity (NOT bookcase: open shelving)
const PAIRS: [number, number][] = [[572, 573], [577, 576], [575, 571]] // bed-nightstand, vanity-mirror, desk-bookcase
const RELATED_CAP = 6
const BED_IMG_FIX: [number, number][] = [[438, 903], [436, 903], [434, 1025]] // variantId -> mediaId

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })

const orderCache = new Map<number, number>()
async function nextOrder(parent: number) {
  if (!orderCache.has(parent)) {
    const r = await client.query<{ m: number }>(`SELECT COALESCE(MAX("order"),0) AS m FROM products_rels WHERE parent_id=$1`, [parent])
    orderCache.set(parent, Number(r.rows[0].m))
  }
  const n = orderCache.get(parent)! + 1
  orderCache.set(parent, n)
  return n
}
async function relExists(parent: number, path: string, col: 'tags_id' | 'products_id', val: number) {
  const r = await client.query(`SELECT 1 FROM products_rels WHERE parent_id=$1 AND path=$2 AND ${col}=$3 LIMIT 1`, [parent, path, val])
  return (r.rowCount ?? 0) > 0
}
async function insRel(parent: number, path: string, col: 'tags_id' | 'products_id', val: number) {
  await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [await nextOrder(parent), parent, path, val])
}

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-13-verna-content  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)
  let inserts = 0, updates = 0

  console.log('1) Publish verna-vanity (#577), keep price 0  [mirror #576 HELD — no images]')
  for (const id of PUBLISH) {
    const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') { console.log(`   #${id}: draft -> published`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    else console.log(`   #${id}: already ${r.rows[0]?.status} — skip`)
  }

  console.log('\n2) Tags — modern -> all 7; storage -> wardrobe/nightstand/vanity')
  for (const p of VERNA) if (!(await relExists(p.id, 'tagIds', 'tags_id', TAG_MODERN))) { console.log(`   +modern  ${p.slug}`); if (APPLY) { await insRel(p.id, 'tagIds', 'tags_id', TAG_MODERN); inserts++ } }
  for (const id of STORAGE_PRODUCTS) if (!(await relExists(id, 'tagIds', 'tags_id', TAG_STORAGE))) { console.log(`   +storage #${id}`); if (APPLY) { await insRel(id, 'tagIds', 'tags_id', TAG_STORAGE); inserts++ } }

  console.log('\n3) seo.ogImage <- first gallery image (only when empty; mirror has none -> skipped)')
  for (const p of VERNA) {
    const cur = await client.query<{ seo_og_image_id: number | null }>(`SELECT seo_og_image_id FROM products WHERE id=$1`, [p.id])
    if (cur.rows[0]?.seo_og_image_id != null) { console.log(`   ${p.slug}: already set — skip`); continue }
    const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
    const mid = g.rows[0]?.media_id
    if (!mid) { console.log(`   ${p.slug}: no gallery image — skip`); continue }
    console.log(`   ${p.slug}: ogImage <- media #${mid}`)
    if (APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, p.id]); updates++ }
  }

  console.log('\n4) Cross-sell — pairsWith + relatedProductIds (same-series)')
  const pairExpand: [number, number][] = []
  for (const [a, b] of PAIRS) pairExpand.push([a, b], [b, a])
  for (const [a, b] of pairExpand) if (!(await relExists(a, 'pairsWithProductIds', 'products_id', b))) { console.log(`   pairsWith ${a} -> ${b}`); if (APPLY) { await insRel(a, 'pairsWithProductIds', 'products_id', b); inserts++ } }
  for (const p of VERNA) {
    const related = VERNA.filter((o) => o.id !== p.id).sort((x, y) => x.prio - y.prio).slice(0, RELATED_CAP)
    for (const r of related) if (!(await relExists(p.id, 'relatedProductIds', 'products_id', r.id))) { if (APPLY) { await insRel(p.id, 'relatedProductIds', 'products_id', r.id); inserts++ } }
    console.log(`   related ${p.slug} -> [${related.map((r) => r.slug.replace('verna-', '')).join(', ')}]`)
  }

  console.log('\n5) verna-bed placeholder images (sizes 90/100/140 — TEMP, closest-size)')
  for (const [vid, mid] of BED_IMG_FIX) {
    const r = await client.query<{ image_id: number | null; sku: string }>(`SELECT image_id, sku FROM product_variants WHERE id=$1`, [vid])
    if (!r.rows[0]) { console.log(`   variant #${vid} missing — skip`); continue }
    if (r.rows[0].image_id != null) { console.log(`   ${r.rows[0].sku}: already has image — skip`); continue }
    console.log(`   ${r.rows[0].sku}: image <- media #${mid}`)
    if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ }
  }

  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels inserted, ${updates} rows updated` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
