/**
 * Reconcile elizabeth-series content/wiring (batch, operator-approved 2026-06-22).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-17-elizabeth-content.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-17-elizabeth-content.mts --apply  # write
 *
 * Idempotent. Decisions D1–D5 + A:
 *   D1 - publish console(#393), vanity(#404), vanity-chair(#405); price 0. HOLD study-chair(#401)
 *        (0 images — also the contradictory in_stock+priced+draft one).
 *   D2 - tags: modern→all 15; storage→wardrobe/nightstand/vanity/file/console.
 *   D3 - cross-sell: pairsWith (bed↔nightstand, vanity↔vanity-chair, vanity↔console-mirror,
 *        study-desk↔study-chair, study-desk↔bookcase) + related (cap 6).
 *   D4 - seo.ogImage from first gallery image (skips image-less study-chair).
 *   D5 - elizabeth-bed: size-180 (finish-less, no image) → double-160-cream (#462).
 *   A  - colour variants for products that show two colours in-gallery but have none:
 *        finish=cream/gray for bookcase, nightstand, standing-mirror, study-desk, wall-shelf;
 *        fabric=cream/gray for the loveseat (category axis is `fabric`; label support added to
 *        variant-helpers.ts). console-vanity-mirror EXCLUDED (its category allows only `size`).
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

const ELIZ = [
  { id: 395, slug: 'elizabeth-bed', prio: 0 }, { id: 407, slug: 'elizabeth-wardrobe', prio: 1 },
  { id: 398, slug: 'elizabeth-nightstand', prio: 2 }, { id: 404, slug: 'elizabeth-vanity', prio: 3 },
  { id: 402, slug: 'elizabeth-study-desk', prio: 4 }, { id: 392, slug: 'elizabeth-bookcase', prio: 5 },
  { id: 396, slug: 'elizabeth-file', prio: 6 }, { id: 393, slug: 'elizabeth-console', prio: 7 },
  { id: 403, slug: 'elizabeth-console-vanity-mirror', prio: 8 }, { id: 400, slug: 'elizabeth-standing-mirror', prio: 9 },
  { id: 394, slug: 'elizabeth-convertible-teen', prio: 10 }, { id: 397, slug: 'elizabeth-loveseat', prio: 11 },
  { id: 401, slug: 'elizabeth-study-chair', prio: 12 }, { id: 406, slug: 'elizabeth-wall-shelf', prio: 13 },
  { id: 405, slug: 'elizabeth-vanity-chair', prio: 14 },
]
const PUBLISH = [393, 404, 405]
const TAG_MODERN = 2, TAG_STORAGE = 3
const STORAGE_PRODUCTS = [407, 398, 404, 396, 393]
const PAIRS: [number, number][] = [[395, 398], [404, 405], [404, 403], [402, 401], [402, 392]]
const RELATED_CAP = 6
const BED_IMG_FIX: [number, number][] = [[295, 462]]
const AXIS_FA: Record<string, string> = { finish: 'روکش', fabric: 'پارچه' }
const VAL_FA: Record<string, string> = { cream: 'کرم', gray: 'خاکستری' }
// A: colour variants — {pid, slug, axis, cream media, gray media}; all in_stock
const COLOUR = [
  { pid: 392, slug: 'elizabeth-bookcase', axis: 'finish', cream: 460, gray: 477 },
  { pid: 398, slug: 'elizabeth-nightstand', axis: 'finish', cream: 465, gray: 482 },
  { pid: 400, slug: 'elizabeth-standing-mirror', axis: 'finish', cream: 468, gray: 485 },
  { pid: 402, slug: 'elizabeth-study-desk', axis: 'finish', cream: 1007, gray: 1009 },
  { pid: 406, slug: 'elizabeth-wall-shelf', axis: 'finish', cream: 474, gray: 491 },
  { pid: 397, slug: 'elizabeth-loveseat', axis: 'fabric', cream: 464, gray: 481 },
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
let inserts = 0, updates = 0, vcreated = 0
const orderCache = new Map<number, number>()
async function nextOrder(parent: number) {
  if (!orderCache.has(parent)) { const r = await client.query<{ m: number }>(`SELECT COALESCE(MAX("order"),0) AS m FROM products_rels WHERE parent_id=$1`, [parent]); orderCache.set(parent, Number(r.rows[0].m)) }
  const n = orderCache.get(parent)! + 1; orderCache.set(parent, n); return n
}
async function relExists(p: number, path: string, col: string, v: number) { const r = await client.query(`SELECT 1 FROM products_rels WHERE parent_id=$1 AND path=$2 AND ${col}=$3 LIMIT 1`, [p, path, v]); return (r.rowCount ?? 0) > 0 }
async function insRel(p: number, path: string, col: string, v: number) { await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [await nextOrder(p), p, path, v]) }
async function ensureVariant(pid: number, sku: string, label: string, axis: string, val: string, imageId: number, order: number) {
  const ex = await client.query(`SELECT 1 FROM product_variants WHERE sku=$1`, [sku])
  if ((ex.rowCount ?? 0) > 0) { console.log(`     ${sku}: exists — skip`); return }
  console.log(`     + ${sku}  "${label}"  img=${imageId}`)
  if (!APPLY) return
  const r = await client.query<{ id: number }>(`INSERT INTO product_variants (product_id, sku, label, price_delta_rials, availability, image_id, display_order, created_at, updated_at) VALUES ($1,$2,$3,0,'in_stock',$4,$5,NOW(),NOW()) RETURNING id`, [pid, sku, label, imageId, order])
  const vid = r.rows[0].id
  await client.query(`INSERT INTO product_variants_axes ("_order","_parent_id",id,key,value) VALUES ($1,$2,$3,$4,$5)`, [0, vid, `${vid}-axis-0`, axis, val])
  vcreated++
}

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-17-elizabeth-content  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  console.log('D1) Publish console/vanity/vanity-chair (price 0); hold study-chair (image-less)')
  for (const id of PUBLISH) {
    const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') { console.log(`   #${id}: draft -> published`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    else console.log(`   #${id}: already ${r.rows[0]?.status} — skip`)
  }

  console.log('\nD2) Tags — modern x15; storage x5')
  for (const p of ELIZ) if (!(await relExists(p.id, 'tags', 'tags_id', TAG_MODERN))) { if (APPLY) { await insRel(p.id, 'tags', 'tags_id', TAG_MODERN); inserts++ } }
  for (const id of STORAGE_PRODUCTS) if (!(await relExists(id, 'tags', 'tags_id', TAG_STORAGE))) { if (APPLY) { await insRel(id, 'tags', 'tags_id', TAG_STORAGE); inserts++ } }
  console.log('   ensured')

  console.log('\nD4) seo.ogImage <- first gallery image')
  for (const p of ELIZ) {
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
  for (const p of ELIZ) { const rel = ELIZ.filter((o) => o.id !== p.id).sort((x, y) => x.prio - y.prio).slice(0, RELATED_CAP); for (const r of rel) if (!(await relExists(p.id, 'relatedProducts', 'products_id', r.id))) { if (APPLY) { await insRel(p.id, 'relatedProducts', 'products_id', r.id); inserts++ } } }
  console.log(`   ${PAIRS.length} pairs + related(${RELATED_CAP}) for all ${ELIZ.length}`)

  console.log('\nD5) elizabeth-bed size-180 -> double-160-cream (#462)')
  for (const [vid, mid] of BED_IMG_FIX) {
    const r = await client.query<{ image_id: number | null; sku: string }>(`SELECT image_id, sku FROM product_variants WHERE id=$1`, [vid])
    if (!r.rows[0]) { console.log(`   variant #${vid} missing — skip`); continue }
    if (r.rows[0].image_id != null) { console.log(`   ${r.rows[0].sku}: already imaged — skip`); continue }
    console.log(`   ${r.rows[0].sku}: image <- #${mid}`)
    if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ }
  }

  console.log('\nA) Colour variants (finish x5 + fabric x1; console-vanity-mirror excluded)')
  for (const c of COLOUR) {
    console.log(`   ${c.slug} [${c.axis}]:`)
    await ensureVariant(c.pid, `${c.slug}-${c.axis}-cream`, `${AXIS_FA[c.axis]}: ${VAL_FA.cream}`, c.axis, 'cream', c.cream, 0)
    await ensureVariant(c.pid, `${c.slug}-${c.axis}-gray`, `${AXIS_FA[c.axis]}: ${VAL_FA.gray}`, c.axis, 'gray', c.gray, 10)
  }

  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels, ${updates} updates, ${vcreated} variants` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
