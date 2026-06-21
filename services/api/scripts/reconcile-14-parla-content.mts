/**
 * Reconcile parla-series content/wiring (batch, operator-approved 2026-06-22).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-14-parla-content.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-14-parla-content.mts --apply  # write
 *
 * Idempotent. Decisions (D1–D5):
 *   D1 - publish ONLY parla-convertible-teen (#504, has images; price left 0).
 *        HOLD the 5 image-less drafts (#499 bed-guard, #513 console-vanity-mirror,
 *        #509 sliding-wardrobe, #511 study-chair, #515 vanity-chair) — audited.
 *   D2 - tags: `modern` (#2) → all 19; `storage` (#3) → wardrobe, combined-wardrobe,
 *        sliding-wardrobe, nightstand, vanity, changing-table, display-cabinet, bed-box.
 *        (Pure data — products_rels rows; no schema change.)
 *   D3 - cross-sell: pairsWith (bed↔nightstand, bunk-bed↔bed-guard, vanity↔vanity-chair,
 *        vanity↔console-mirror, study-desk↔study-chair, study-desk↔bookcase) +
 *        relatedProductIds same-series (priority-ordered, cap 6).
 *   D4 - seo.ogImage from first gallery image (skips the 5 image-less drafts).
 *   D5 - parla-bed (#506) placeholders for its 3 finish-less image-less variants:
 *        size 90 → 100-cream (#826); sizes 140 & 180 → 160-cream (#823). TEMP.
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
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const i = t.indexOf('='); if (i > 0 && !process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
} catch { /* env from process */ }
if (!process.env.DATABASE_URI) { console.error('DATABASE_URI not set'); process.exit(1) }

const APPLY = process.argv.includes('--apply')

// id, slug, prio (related ordering: marquee first)
const PARLA = [
  { id: 506, slug: 'parla-bed', prio: 0 },
  { id: 517, slug: 'parla-wardrobe', prio: 1 },
  { id: 507, slug: 'parla-nightstand', prio: 2 },
  { id: 514, slug: 'parla-vanity', prio: 3 },
  { id: 512, slug: 'parla-study-desk', prio: 4 },
  { id: 500, slug: 'parla-bookcase', prio: 5 },
  { id: 503, slug: 'parla-combined-wardrobe', prio: 6 },
  { id: 509, slug: 'parla-sliding-wardrobe', prio: 7 },
  { id: 505, slug: 'parla-display-cabinet', prio: 8 },
  { id: 501, slug: 'parla-bunk-bed', prio: 9 },
  { id: 504, slug: 'parla-convertible-teen', prio: 10 },
  { id: 498, slug: 'parla-bed-box', prio: 11 },
  { id: 502, slug: 'parla-changing-table', prio: 12 },
  { id: 510, slug: 'parla-standing-mirror', prio: 13 },
  { id: 513, slug: 'parla-console-vanity-mirror', prio: 14 },
  { id: 516, slug: 'parla-wall-shelf', prio: 15 },
  { id: 511, slug: 'parla-study-chair', prio: 16 },
  { id: 515, slug: 'parla-vanity-chair', prio: 17 },
  { id: 499, slug: 'parla-bed-guard', prio: 18 },
]
const PUBLISH = [504]                                              // convertible-teen only
const TAG_MODERN = 2, TAG_STORAGE = 3
const STORAGE_PRODUCTS = [517, 503, 509, 507, 514, 502, 505, 498] // wardrobe, combined-, sliding-, nightstand, vanity, changing-table, display-cabinet, bed-box
const PAIRS: [number, number][] = [[506, 507], [501, 499], [514, 515], [514, 513], [512, 511], [512, 500]]
const RELATED_CAP = 6
const BED_IMG_FIX: [number, number][] = [[388, 826], [380, 823], [383, 823]] // variantId -> mediaId (cream placeholders)

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
const orderCache = new Map<number, number>()
async function nextOrder(parent: number) {
  if (!orderCache.has(parent)) { const r = await client.query<{ m: number }>(`SELECT COALESCE(MAX("order"),0) AS m FROM products_rels WHERE parent_id=$1`, [parent]); orderCache.set(parent, Number(r.rows[0].m)) }
  const n = orderCache.get(parent)! + 1; orderCache.set(parent, n); return n
}
async function relExists(parent: number, path: string, col: 'tags_id' | 'products_id', val: number) {
  const r = await client.query(`SELECT 1 FROM products_rels WHERE parent_id=$1 AND path=$2 AND ${col}=$3 LIMIT 1`, [parent, path, val]); return (r.rowCount ?? 0) > 0
}
async function insRel(parent: number, path: string, col: 'tags_id' | 'products_id', val: number) {
  await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [await nextOrder(parent), parent, path, val])
}

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-14-parla-content  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)
  let inserts = 0, updates = 0

  console.log('D1) Publish parla-convertible-teen (#504), price 0  [5 image-less drafts HELD/audited]')
  for (const id of PUBLISH) {
    const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') { console.log(`   #${id}: draft -> published`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    else console.log(`   #${id}: already ${r.rows[0]?.status} — skip`)
  }

  console.log('\nD2) Tags — modern -> all 19; storage -> 8 closed-storage pieces')
  for (const p of PARLA) if (!(await relExists(p.id, 'tagIds', 'tags_id', TAG_MODERN))) { console.log(`   +modern  ${p.slug}`); if (APPLY) { await insRel(p.id, 'tagIds', 'tags_id', TAG_MODERN); inserts++ } }
  for (const id of STORAGE_PRODUCTS) if (!(await relExists(id, 'tagIds', 'tags_id', TAG_STORAGE))) { console.log(`   +storage #${id}`); if (APPLY) { await insRel(id, 'tagIds', 'tags_id', TAG_STORAGE); inserts++ } }

  console.log('\nD4) seo.ogImage <- first gallery image (only when empty)')
  for (const p of PARLA) {
    const cur = await client.query<{ seo_og_image_id: number | null }>(`SELECT seo_og_image_id FROM products WHERE id=$1`, [p.id])
    if (cur.rows[0]?.seo_og_image_id != null) { continue }
    const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
    const mid = g.rows[0]?.media_id
    if (!mid) { console.log(`   ${p.slug}: no gallery image — skip`); continue }
    console.log(`   ${p.slug}: ogImage <- media #${mid}`)
    if (APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, p.id]); updates++ }
  }

  console.log('\nD3) Cross-sell — pairsWith + relatedProductIds (same-series)')
  const pairExpand: [number, number][] = []
  for (const [a, b] of PAIRS) pairExpand.push([a, b], [b, a])
  for (const [a, b] of pairExpand) if (!(await relExists(a, 'pairsWithProductIds', 'products_id', b))) { console.log(`   pairsWith ${a} -> ${b}`); if (APPLY) { await insRel(a, 'pairsWithProductIds', 'products_id', b); inserts++ } }
  for (const p of PARLA) {
    const related = PARLA.filter((o) => o.id !== p.id).sort((x, y) => x.prio - y.prio).slice(0, RELATED_CAP)
    for (const r of related) if (!(await relExists(p.id, 'relatedProductIds', 'products_id', r.id))) { if (APPLY) { await insRel(p.id, 'relatedProductIds', 'products_id', r.id); inserts++ } }
  }
  console.log(`   wired related (top ${RELATED_CAP} marquee) for all ${PARLA.length}`)

  console.log('\nD5) parla-bed placeholder images (TEMP, closest finish/size)')
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
