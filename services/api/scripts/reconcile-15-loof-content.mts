/**
 * Reconcile loof-series content/wiring (batch, operator-approved 2026-06-22).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-15-loof-content.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-15-loof-content.mts --apply  # write
 *
 * Idempotent. Decisions D1–D5 + A:
 *   D1 - publish bed-box(#435), study-chair(#446), vanity(#449); price 0. HOLD the
 *        two image-less drafts bed-guard(#436), vanity-chair(#450) — audited.
 *   D2 - tags: modern→all 17; storage→wardrobe/nightstand/vanity/changing-table/
 *        display-cabinet/bed-box.
 *   D3 - cross-sell: pairsWith (bed↔nightstand, convertible-teen↔bed-guard,
 *        vanity↔vanity-chair, vanity↔console-mirror, study-desk↔study-chair,
 *        study-desk↔bookcase, changing-table↔changing-top) + related (cap 6).
 *   D4 - seo.ogImage from first gallery image (skips the 2 image-less).
 *   D5 - loof-bed placeholders: sizes 90/100/140 → the single-120-cream shot (#625).
 *        140 is a double using a single-bed stopgap per operator (logged).
 *   A  - create cream+green `finish` variants for the 7 products that show both
 *        finishes in their gallery but had 0 variants (so green was unselectable):
 *        bookcase, changing-table, display-cabinet, nightstand, standing-mirror,
 *        study-desk, wall-shelf. Each variant mapped to its matching gallery image, delta 0.
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

const LOOF = [
  { id: 442, slug: 'loof-bed', prio: 0 }, { id: 452, slug: 'loof-wardrobe', prio: 1 },
  { id: 443, slug: 'loof-nightstand', prio: 2 }, { id: 449, slug: 'loof-vanity', prio: 3 },
  { id: 447, slug: 'loof-study-desk', prio: 4 }, { id: 437, slug: 'loof-bookcase', prio: 5 },
  { id: 441, slug: 'loof-display-cabinet', prio: 6 }, { id: 438, slug: 'loof-changing-table', prio: 7 },
  { id: 440, slug: 'loof-convertible-teen', prio: 8 }, { id: 435, slug: 'loof-bed-box', prio: 9 },
  { id: 445, slug: 'loof-standing-mirror', prio: 10 }, { id: 448, slug: 'loof-console-vanity-mirror', prio: 11 },
  { id: 439, slug: 'loof-changing-top', prio: 12 }, { id: 451, slug: 'loof-wall-shelf', prio: 13 },
  { id: 446, slug: 'loof-study-chair', prio: 14 }, { id: 450, slug: 'loof-vanity-chair', prio: 15 },
  { id: 436, slug: 'loof-bed-guard', prio: 16 },
]
const PUBLISH = [435, 446, 449]
const TAG_MODERN = 2, TAG_STORAGE = 3
const STORAGE_PRODUCTS = [452, 443, 449, 438, 441, 435]
const PAIRS: [number, number][] = [[442, 443], [440, 436], [449, 450], [449, 448], [447, 446], [447, 437], [438, 439]]
const RELATED_CAP = 6
const BED_IMG_FIX: [number, number][] = [[340, 625], [337, 625], [336, 625]]
// A: finish variants — {pid, slug, cream media, green media}; all in_stock
const FINISH = [
  { pid: 437, slug: 'loof-bookcase', cream: 620, green: 660 },
  { pid: 438, slug: 'loof-changing-table', cream: 621, green: 661 },
  { pid: 441, slug: 'loof-display-cabinet', cream: 623, green: 664 },
  { pid: 443, slug: 'loof-nightstand', cream: 624, green: 665 },
  { pid: 445, slug: 'loof-standing-mirror', cream: 626, green: 669 },
  { pid: 447, slug: 'loof-study-desk', cream: 627, green: 670 },
  { pid: 451, slug: 'loof-wall-shelf', cream: 629, green: 673 },
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
let inserts = 0, updates = 0, vcreated = 0
const orderCache = new Map<number, number>()
async function nextOrder(parent: number) {
  if (!orderCache.has(parent)) { const r = await client.query<{ m: number }>(`SELECT COALESCE(MAX("order"),0) AS m FROM products_rels WHERE parent_id=$1`, [parent]); orderCache.set(parent, Number(r.rows[0].m)) }
  const n = orderCache.get(parent)! + 1; orderCache.set(parent, n); return n
}
async function relExists(p: number, path: string, col: 'tags_id' | 'products_id', v: number) { const r = await client.query(`SELECT 1 FROM products_rels WHERE parent_id=$1 AND path=$2 AND ${col}=$3 LIMIT 1`, [p, path, v]); return (r.rowCount ?? 0) > 0 }
async function insRel(p: number, path: string, col: 'tags_id' | 'products_id', v: number) { await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [await nextOrder(p), p, path, v]) }

async function ensureVariant(pid: number, sku: string, label: string, finishVal: string, imageId: number, order: number) {
  const ex = await client.query(`SELECT 1 FROM product_variants WHERE sku=$1`, [sku])
  if ((ex.rowCount ?? 0) > 0) { console.log(`     ${sku}: exists — skip`); return }
  console.log(`     + ${sku}  "${label}"  img=${imageId}`)
  if (!APPLY) return
  const r = await client.query<{ id: number }>(`INSERT INTO product_variants (product_id, sku, label, price_delta_rials, availability, image_id, display_order, created_at, updated_at) VALUES ($1,$2,$3,0,'in_stock',$4,$5,NOW(),NOW()) RETURNING id`, [pid, sku, label, imageId, order])
  const vid = r.rows[0].id
  await client.query(`INSERT INTO product_variants_axes ("_order","_parent_id",id,key,value) VALUES ($1,$2,$3,$4,$5)`, [0, vid, `${vid}-axis-0`, 'finish', finishVal])
  vcreated++
}

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-15-loof-content  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  console.log('D1) Publish bed-box/study-chair/vanity (price 0); hold the 2 image-less drafts')
  for (const id of PUBLISH) {
    const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') { console.log(`   #${id}: draft -> published`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    else console.log(`   #${id}: already ${r.rows[0]?.status} — skip`)
  }

  console.log('\nD2) Tags — modern -> all 17; storage -> 6 pieces')
  for (const p of LOOF) if (!(await relExists(p.id, 'tagIds', 'tags_id', TAG_MODERN))) { if (APPLY) { await insRel(p.id, 'tagIds', 'tags_id', TAG_MODERN); inserts++ } }
  for (const id of STORAGE_PRODUCTS) if (!(await relExists(id, 'tagIds', 'tags_id', TAG_STORAGE))) { if (APPLY) { await insRel(id, 'tagIds', 'tags_id', TAG_STORAGE); inserts++ } }
  console.log('   modern x17, storage x6 ensured')

  console.log('\nD4) seo.ogImage <- first gallery image (only when empty)')
  for (const p of LOOF) {
    const cur = await client.query<{ seo_og_image_id: number | null }>(`SELECT seo_og_image_id FROM products WHERE id=$1`, [p.id])
    if (cur.rows[0]?.seo_og_image_id != null) continue
    const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
    const mid = g.rows[0]?.media_id
    if (!mid) { console.log(`   ${p.slug}: no gallery — skip`); continue }
    if (APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, p.id]); updates++ }
  }
  console.log('   ogImage seeded on products with galleries')

  console.log('\nD3) Cross-sell — pairsWith + relatedProductIds')
  const pe: [number, number][] = []; for (const [a, b] of PAIRS) pe.push([a, b], [b, a])
  for (const [a, b] of pe) if (!(await relExists(a, 'pairsWithProductIds', 'products_id', b))) { if (APPLY) { await insRel(a, 'pairsWithProductIds', 'products_id', b); inserts++ } }
  for (const p of LOOF) { const rel = LOOF.filter((o) => o.id !== p.id).sort((x, y) => x.prio - y.prio).slice(0, RELATED_CAP); for (const r of rel) if (!(await relExists(p.id, 'relatedProductIds', 'products_id', r.id))) { if (APPLY) { await insRel(p.id, 'relatedProductIds', 'products_id', r.id); inserts++ } } }
  console.log(`   ${PAIRS.length} functional pairs + related(${RELATED_CAP}) for all ${LOOF.length}`)

  console.log('\nD5) loof-bed placeholders (90/100/140 -> single-120-cream #625; 140 stopgap)')
  for (const [vid, mid] of BED_IMG_FIX) {
    const r = await client.query<{ image_id: number | null; sku: string }>(`SELECT image_id, sku FROM product_variants WHERE id=$1`, [vid])
    if (!r.rows[0]) { console.log(`   variant #${vid} missing — skip`); continue }
    if (r.rows[0].image_id != null) { console.log(`   ${r.rows[0].sku}: already imaged — skip`); continue }
    console.log(`   ${r.rows[0].sku}: image <- #${mid}`)
    if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ }
  }

  console.log('\nA) Create cream+green finish variants for the 7 finish-shown-but-unselectable products')
  for (const f of FINISH) {
    console.log(`   ${f.slug}:`)
    await ensureVariant(f.pid, `${f.slug}-finish-cream`, 'روکش: کرم', 'cream', f.cream, 0)
    await ensureVariant(f.pid, `${f.slug}-finish-green`, 'روکش: سبز', 'green', f.green, 10)
  }

  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels, ${updates} updates, ${vcreated} variants created` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
