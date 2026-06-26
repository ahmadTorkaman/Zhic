/**
 * Reconcile baloot-series content/wiring (batch, operator-approved 2026-06-22).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-18-baloot-content.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-18-baloot-content.mts --apply  # write
 *
 * Idempotent. Decisions D1–D5 (no colour-variant gap in this series):
 *   D1 - publish vanity(#307); price 0. HOLD the 3 image-less drafts changing-top(#296),
 *        loveseat(#300), wall-shelf(#309) — all in_stock+priced+draft contradictions — audited.
 *   D2 - tags: modern→all 15; storage→wardrobe/nightstand/vanity/console.
 *   D3 - cross-sell: pairsWith (bed↔nightstand, vanity↔vanity-chair, vanity↔console-mirror,
 *        study-desk↔study-chair, study-desk↔bookcase) + related (cap 6).
 *   D4 - seo.ogImage from first gallery image (skips the 3 image-less drafts).
 *   D5 - baloot-bed: attach the existing double-160-180 images to the two image-less 160
 *        variants — 160/high (#219) → #994, 160/low (#220) → #995. Image-only UPDATE on
 *        existing rows; no new variant or axis.
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
  for (const line of env.split('\n')) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const i = t.indexOf('='); if (i > 0 && !process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim() }
} catch { /* env from process */ }
if (!process.env.DATABASE_URI) { console.error('DATABASE_URI not set'); process.exit(1) }

const APPLY = process.argv.includes('--apply')

const BALOOT = [
  { id: 299, slug: 'baloot-bed', prio: 0 }, { id: 310, slug: 'baloot-wardrobe', prio: 1 },
  { id: 301, slug: 'baloot-nightstand', prio: 2 }, { id: 307, slug: 'baloot-vanity', prio: 3 },
  { id: 305, slug: 'baloot-study-desk', prio: 4 }, { id: 295, slug: 'baloot-bookcase', prio: 5 },
  { id: 297, slug: 'baloot-console', prio: 6 }, { id: 306, slug: 'baloot-console-vanity-mirror', prio: 7 },
  { id: 303, slug: 'baloot-standing-mirror', prio: 8 }, { id: 298, slug: 'baloot-convertible-teen', prio: 9 },
  { id: 296, slug: 'baloot-changing-top', prio: 10 }, { id: 300, slug: 'baloot-loveseat', prio: 11 },
  { id: 304, slug: 'baloot-study-chair', prio: 12 }, { id: 308, slug: 'baloot-vanity-chair', prio: 13 },
  { id: 309, slug: 'baloot-wall-shelf', prio: 14 },
]
const PUBLISH = [307]
const TAG_MODERN = 2, TAG_STORAGE = 3
const STORAGE_PRODUCTS = [310, 301, 307, 297]
const PAIRS: [number, number][] = [[299, 301], [307, 308], [307, 306], [305, 304], [305, 295]]
const RELATED_CAP = 6
const BED_IMG_FIX: [number, number][] = [[219, 994], [220, 995]]

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
let inserts = 0, updates = 0
const orderCache = new Map<number, number>()
async function nextOrder(parent: number) {
  if (!orderCache.has(parent)) { const r = await client.query<{ m: number }>(`SELECT COALESCE(MAX("order"),0) AS m FROM products_rels WHERE parent_id=$1`, [parent]); orderCache.set(parent, Number(r.rows[0].m)) }
  const n = orderCache.get(parent)! + 1; orderCache.set(parent, n); return n
}
async function relExists(p: number, path: string, col: string, v: number) { const r = await client.query(`SELECT 1 FROM products_rels WHERE parent_id=$1 AND path=$2 AND ${col}=$3 LIMIT 1`, [p, path, v]); return (r.rowCount ?? 0) > 0 }
async function insRel(p: number, path: string, col: string, v: number) { await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [await nextOrder(p), p, path, v]) }

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-18-baloot-content  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  console.log('D1) Publish vanity (price 0); hold 3 image-less drafts')
  for (const id of PUBLISH) {
    const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') { console.log(`   #${id}: draft -> published`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    else console.log(`   #${id}: already ${r.rows[0]?.status} — skip`)
  }

  console.log('\nD2) Tags — modern x15; storage x4')
  for (const p of BALOOT) if (!(await relExists(p.id, 'tags', 'tags_id', TAG_MODERN))) { if (APPLY) { await insRel(p.id, 'tags', 'tags_id', TAG_MODERN); inserts++ } }
  for (const id of STORAGE_PRODUCTS) if (!(await relExists(id, 'tags', 'tags_id', TAG_STORAGE))) { if (APPLY) { await insRel(id, 'tags', 'tags_id', TAG_STORAGE); inserts++ } }
  console.log('   ensured')

  console.log('\nD4) seo.ogImage <- first gallery image')
  for (const p of BALOOT) {
    const cur = await client.query<{ seo_og_image_id: number | null }>(`SELECT seo_og_image_id FROM products WHERE id=$1`, [p.id])
    if (cur.rows[0]?.seo_og_image_id != null) continue
    const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
    const mid = g.rows[0]?.media_id
    if (!mid) { console.log(`   ${p.slug}: no gallery — skip`); continue }
    if (APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, p.id]); updates++ }
  }
  console.log('   seeded')

  console.log('\nD3) Cross-sell — pairsWith + related')
  const pe: [number, number][] = []; for (const [a, b] of PAIRS) pe.push([a, b], [b, a])
  for (const [a, b] of pe) if (!(await relExists(a, 'pairsWithProducts', 'products_id', b))) { if (APPLY) { await insRel(a, 'pairsWithProducts', 'products_id', b); inserts++ } }
  for (const p of BALOOT) { const rel = BALOOT.filter((o) => o.id !== p.id).sort((x, y) => x.prio - y.prio).slice(0, RELATED_CAP); for (const r of rel) if (!(await relExists(p.id, 'relatedProducts', 'products_id', r.id))) { if (APPLY) { await insRel(p.id, 'relatedProducts', 'products_id', r.id); inserts++ } } }
  console.log(`   ${PAIRS.length} pairs + related(${RELATED_CAP}) for all ${BALOOT.length}`)

  console.log('\nD5) baloot-bed 160/high -> #994, 160/low -> #995 (image-only on existing variants)')
  for (const [vid, mid] of BED_IMG_FIX) {
    const r = await client.query<{ image_id: number | null; sku: string }>(`SELECT image_id, sku FROM product_variants WHERE id=$1`, [vid])
    if (!r.rows[0]) { console.log(`   variant #${vid} missing — skip`); continue }
    if (r.rows[0].image_id != null) { console.log(`   ${r.rows[0].sku}: already imaged — skip`); continue }
    console.log(`   ${r.rows[0].sku}: image <- #${mid}`)
    if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ }
  }

  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels, ${updates} updates` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
