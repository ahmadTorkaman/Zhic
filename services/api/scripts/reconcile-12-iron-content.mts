/**
 * Reconcile iron-series content/wiring (batch, operator-approved 2026-06-21).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-12-iron-content.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-12-iron-content.mts --apply  # write
 *
 * Idempotent. Sections:
 *   1. Publish the draft trio (#419/#421/#422). basePriceRials left at 0 per
 *      operator decision (real prices pending — logged in the catalog audit).
 *   2. Tags: `modern` (#2) → all 12; `storage` (#3) → wardrobe/file/nightstand/vanity.
 *   3. SEO ogImage: seed seo_og_image_id from each product's first gallery image
 *      (only when empty). Meta title/description left for the SEO specialist.
 *   4. Cross-sell: pairsWith (bed↔nightstand, desk↔chair, vanity↔vanity-chair)
 *      + relatedProductIds (same-series, priority-ordered, capped at 6).
 *   5. Bed (#414) placeholder images: sizes 90/140/180 had no photo — assign the
 *      closest existing size within the single/double class (TEMP — real per-size
 *      shots pending, logged in the audit). 90→100(single), 140→160 & 180→160(double).
 *
 * Direct pg (getPayload fails on Node 24 here — every reconcile-*.mts uses pg).
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

// id, slug, marquee-priority (lower = shown first in related lists)
const IRON = [
  { id: 414, slug: 'iron-bed', prio: 0 },
  { id: 424, slug: 'iron-wardrobe', prio: 1 },
  { id: 416, slug: 'iron-nightstand', prio: 2 },
  { id: 421, slug: 'iron-vanity', prio: 3 },
  { id: 420, slug: 'iron-study-desk', prio: 4 },
  { id: 413, slug: 'iron-bookcase', prio: 5 },
  { id: 415, slug: 'iron-file', prio: 6 },
  { id: 418, slug: 'iron-standing-mirror', prio: 7 },
  { id: 423, slug: 'iron-wall-mirror', prio: 8 },
  { id: 419, slug: 'iron-study-chair', prio: 9 },
  { id: 422, slug: 'iron-vanity-chair', prio: 10 },
  { id: 581, slug: 'iron-standing-mirror-regal', prio: 11 },
]
const ALL_IDS = IRON.map((p) => p.id)
const DRAFTS = [419, 421, 422]
const TAG_MODERN = 2
const TAG_STORAGE = 3
const STORAGE_PRODUCTS = [424, 415, 416, 421] // wardrobe, file, nightstand, vanity
const PAIRS: [number, number][] = [[414, 416], [420, 419], [421, 422]] // bidirectional
const RELATED_CAP = 6
const BED_IMG_FIX: [number, number][] = [[317, 506], [311, 503], [313, 503]] // variantId -> mediaId

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })

// per-parent products_rels "order" counter (continue after existing rows)
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
  const ord = await nextOrder(parent)
  await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [ord, parent, path, val])
}

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-12-iron-content  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)
  let inserts = 0, updates = 0

  // 1. Publish drafts
  console.log('1) Publish draft trio (#419/#421/#422), keep basePriceRials=0')
  for (const id of DRAFTS) {
    const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') {
      console.log(`   #${id}: draft -> published`)
      if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at, NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ }
    } else console.log(`   #${id}: already ${r.rows[0]?.status} — skip`)
  }

  // 2. Tags
  console.log('\n2) Tags — modern -> all 12; storage -> wardrobe/file/nightstand/vanity')
  for (const p of IRON) {
    if (!(await relExists(p.id, 'tagIds', 'tags_id', TAG_MODERN))) { console.log(`   +modern  ${p.slug}`); if (APPLY) { await insRel(p.id, 'tagIds', 'tags_id', TAG_MODERN); inserts++ } }
  }
  for (const id of STORAGE_PRODUCTS) {
    if (!(await relExists(id, 'tagIds', 'tags_id', TAG_STORAGE))) { console.log(`   +storage #${id}`); if (APPLY) { await insRel(id, 'tagIds', 'tags_id', TAG_STORAGE); inserts++ } }
  }

  // 3. SEO ogImage from first gallery image
  console.log('\n3) seo.ogImage <- first gallery image (only when empty)')
  for (const p of IRON) {
    const cur = await client.query<{ seo_og_image_id: number | null }>(`SELECT seo_og_image_id FROM products WHERE id=$1`, [p.id])
    if (cur.rows[0]?.seo_og_image_id != null) { console.log(`   ${p.slug}: already set (#${cur.rows[0].seo_og_image_id}) — skip`); continue }
    const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
    const mid = g.rows[0]?.media_id
    if (!mid) { console.log(`   ${p.slug}: no gallery image — skip`); continue }
    console.log(`   ${p.slug}: ogImage <- media #${mid}`)
    if (APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, p.id]); updates++ }
  }

  // 4. Cross-sell
  console.log('\n4) Cross-sell — pairsWith (functional) + relatedProductIds (same-series)')
  const pairExpand: [number, number][] = []
  for (const [a, b] of PAIRS) { pairExpand.push([a, b], [b, a]) }
  for (const [a, b] of pairExpand) {
    if (!(await relExists(a, 'pairsWithProductIds', 'products_id', b))) { console.log(`   pairsWith ${a} -> ${b}`); if (APPLY) { await insRel(a, 'pairsWithProductIds', 'products_id', b); inserts++ } }
  }
  const MIRRORS = [418, 581, 423]
  for (const p of IRON) {
    const others = IRON.filter((o) => o.id !== p.id)
    let pool = others.sort((x, y) => x.prio - y.prio)
    if (MIRRORS.includes(p.id)) {
      // Mirror PDPs lead with the other mirrors (alternatives), then marquee pieces.
      const mir = pool.filter((o) => MIRRORS.includes(o.id))
      const rest = pool.filter((o) => !MIRRORS.includes(o.id))
      pool = [...mir, ...rest]
    }
    const related = pool.slice(0, RELATED_CAP)
    for (const r of related) {
      if (!(await relExists(p.id, 'relatedProductIds', 'products_id', r.id))) { if (APPLY) { await insRel(p.id, 'relatedProductIds', 'products_id', r.id); inserts++ } }
    }
    console.log(`   related ${p.slug} -> [${related.map((r) => r.slug.replace('iron-', '')).join(', ')}]`)
  }

  // 5. Bed placeholder images
  console.log('\n5) iron-bed placeholder images (sizes 90/140/180 — TEMP, closest-size)')
  for (const [vid, mid] of BED_IMG_FIX) {
    const r = await client.query<{ image_id: number | null; sku: string }>(`SELECT image_id, sku FROM product_variants WHERE id=$1`, [vid])
    if (!r.rows[0]) { console.log(`   variant #${vid} missing — skip`); continue }
    if (r.rows[0].image_id != null) { console.log(`   ${r.rows[0].sku}: already has image #${r.rows[0].image_id} — skip`); continue }
    console.log(`   ${r.rows[0].sku}: image <- media #${mid}`)
    if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ }
  }

  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels inserted, ${updates} rows updated` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
