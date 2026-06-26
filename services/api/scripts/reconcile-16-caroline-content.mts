/**
 * Reconcile caroline-series content/wiring (batch, operator-approved 2026-06-22).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-16-caroline-content.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-16-caroline-content.mts --apply  # write
 *
 * Idempotent. Decisions D1–D5 (+ gallery surface):
 *   D1 - publish all 5 drafts (all have images): changing-top(#325), convertible-sofa(#326),
 *        convertible-teen(#579), study-chair(#332), vanity-chair(#336). Price left 0.
 *   D2 - tags: modern→all 16; storage→wardrobe/nightstand/vanity/file/bed-box.
 *   D3 - cross-sell: pairsWith (bed↔nightstand, vanity↔vanity-chair, vanity↔console-mirror,
 *        study-desk↔study-chair, study-desk↔bookcase) + related (cap 6).
 *   D4 - seo.ogImage from first gallery image (all 16 have galleries).
 *   D5 - caroline-bed placeholders: size 90 → single-100 (#410); sizes 140 & 180 → double-160 (#407).
 *   +  - surface the existing double-160 photo (#407) in the caroline-bed gallery
 *        (it had a matching variant but was missing from the gallery carousel).
 *
 * No finish-variant gap in this series (unlike loof). Direct pg.
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

const CAROLINE = [
  { id: 327, slug: 'caroline-bed', prio: 0 }, { id: 338, slug: 'caroline-wardrobe', prio: 1 },
  { id: 329, slug: 'caroline-nightstand', prio: 2 }, { id: 335, slug: 'caroline-vanity', prio: 3 },
  { id: 333, slug: 'caroline-study-desk', prio: 4 }, { id: 324, slug: 'caroline-bookcase', prio: 5 },
  { id: 328, slug: 'caroline-file', prio: 6 }, { id: 323, slug: 'caroline-bed-box', prio: 7 },
  { id: 334, slug: 'caroline-console-vanity-mirror', prio: 8 }, { id: 331, slug: 'caroline-standing-mirror', prio: 9 },
  { id: 326, slug: 'caroline-convertible-sofa', prio: 10 }, { id: 579, slug: 'caroline-convertible-teen', prio: 11 },
  { id: 325, slug: 'caroline-changing-top', prio: 12 }, { id: 337, slug: 'caroline-wall-shelf', prio: 13 },
  { id: 332, slug: 'caroline-study-chair', prio: 14 }, { id: 336, slug: 'caroline-vanity-chair', prio: 15 },
]
const PUBLISH = [325, 326, 579, 332, 336]
const TAG_MODERN = 2, TAG_STORAGE = 3
const STORAGE_PRODUCTS = [338, 329, 335, 328, 323]
const PAIRS: [number, number][] = [[327, 329], [335, 336], [335, 334], [333, 332], [333, 324]]
const RELATED_CAP = 6
const BED_IMG_FIX: [number, number][] = [[245, 410], [239, 407], [241, 407]]
const BED_ID = 327, BED_GALLERY_ADD = 407

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
  console.log(`\n=== reconcile-16-caroline-content  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  console.log('D1) Publish all 5 drafts (price 0)')
  for (const id of PUBLISH) {
    const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') { console.log(`   #${id}: draft -> published`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    else console.log(`   #${id}: already ${r.rows[0]?.status} — skip`)
  }

  console.log('\nD2) Tags — modern x16; storage x5')
  for (const p of CAROLINE) if (!(await relExists(p.id, 'tags', 'tags_id', TAG_MODERN))) { if (APPLY) { await insRel(p.id, 'tags', 'tags_id', TAG_MODERN); inserts++ } }
  for (const id of STORAGE_PRODUCTS) if (!(await relExists(id, 'tags', 'tags_id', TAG_STORAGE))) { if (APPLY) { await insRel(id, 'tags', 'tags_id', TAG_STORAGE); inserts++ } }
  console.log('   ensured')

  console.log('\nD4) seo.ogImage <- first gallery image')
  for (const p of CAROLINE) {
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
  for (const p of CAROLINE) { const rel = CAROLINE.filter((o) => o.id !== p.id).sort((x, y) => x.prio - y.prio).slice(0, RELATED_CAP); for (const r of rel) if (!(await relExists(p.id, 'relatedProducts', 'products_id', r.id))) { if (APPLY) { await insRel(p.id, 'relatedProducts', 'products_id', r.id); inserts++ } } }
  console.log(`   ${PAIRS.length} pairs + related(${RELATED_CAP}) for all ${CAROLINE.length}`)

  console.log('\nD5) caroline-bed placeholders (90->single-100 #410; 140 & 180->double-160 #407)')
  for (const [vid, mid] of BED_IMG_FIX) {
    const r = await client.query<{ image_id: number | null; sku: string }>(`SELECT image_id, sku FROM product_variants WHERE id=$1`, [vid])
    if (!r.rows[0]) { console.log(`   variant #${vid} missing — skip`); continue }
    if (r.rows[0].image_id != null) { console.log(`   ${r.rows[0].sku}: already imaged — skip`); continue }
    console.log(`   ${r.rows[0].sku}: image <- #${mid}`)
    if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ }
  }

  console.log('\n+) Surface double-160 photo (#407) in caroline-bed gallery')
  if (await relExists(BED_ID, 'gallery', 'media_id', BED_GALLERY_ADD)) console.log(`   #${BED_GALLERY_ADD} already in gallery — skip`)
  else { console.log(`   + add media #${BED_GALLERY_ADD} to gallery`); if (APPLY) { await insRel(BED_ID, 'gallery', 'media_id', BED_GALLERY_ADD); inserts++ } }

  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels, ${updates} updates` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
