/**
 * Reconcile 6 series in one pass: lukaplus, bw, skate, mocha, lotus, elegance.
 * (batch, operator-approved 2026-06-22, deep-audited)
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-19-six-series.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-19-six-series.mts --apply  # write
 *
 * Idempotent. Per design: D1 publish the imaged drafts (price 0; image-less held + audited),
 * D2 modern→all + storage→listed, D3 cross-sell (functional pairs + related cap 6),
 * D4 seo.ogImage from first gallery, D5 bed placeholder images (closest existing shot).
 * No finish-variant gap in any of the six.
 *
 * Plus: bw-wardrobe 2x2 — the variants were doors=1(img 1-mdf), doors=2/glass, doors=2(img 2-mdf);
 * add door_material=mdf to the two bare ones and create the missing doors=1/door_material=glass,
 * giving a clean {1,2}x{glass,mdf} matrix on the matching images.
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
} catch { /* env */ }
if (!process.env.DATABASE_URI) { console.error('DATABASE_URI not set'); process.exit(1) }

const APPLY = process.argv.includes('--apply')
const TAG_MODERN = 2, TAG_STORAGE = 3
const PT_PRIO: Record<string, number> = { bed: 0, closet: 1, nightstand: 2, vanity: 3, desk: 4, bookcase: 5, dresser: 6, console: 7, display_cabinet: 8, mirror: 9, sofa: 10, chair: 11, bracket: 12, changing_table: 13 }
const RELATED_CAP = 6

// publish[] = imaged drafts to publish; storage[] = storage-tag products; pairs[] = functional pairs; bedFix[] = [variantId, mediaId]
const DESIGNS = [
  { slug: 'lukaplus', id: 34, publish: [480, 481], storage: [474, 480, 483], pairs: [[473, 474], [480, 481], [480, 479], [478, 477], [478, 472], [471, 473]], bedFix: [[362, 768], [360, 768], [358, 766]] },
  { slug: 'bw', id: 23, publish: [317, 315, 318], storage: [312, 318, 322], pairs: [[313, 312], [318, 319], [318, 317], [316, 315], [316, 311]], bedFix: [] },
  { slug: 'skate', id: 39, publish: [567], storage: [562, 567, 570], pairs: [[563, 562], [566, 565], [566, 560]], bedFix: [[431, 890], [430, 890]] },
  { slug: 'mocha', id: 35, publish: [493], storage: [485, 486, 492, 494], pairs: [[487, 486], [492, 493], [492, 491], [490, 489], [490, 484]], bedFix: [[367, 802]] },
  { slug: 'lotus', id: 33, publish: [], storage: [462, 463, 467, 470], pairs: [[461, 463], [466, 460], [459, 461]], bedFix: [[355, 694], [350, 690]] },
  { slug: 'elegance', id: 26, publish: [379, 380], storage: [372, 373, 379, 381], pairs: [[374, 373], [379, 378], [377, 376], [377, 371]], bedFix: [[279, 453]] },
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
let inserts = 0, updates = 0, vcreated = 0
const orderCache = new Map<number, number>()
async function nextOrder(p: number) {
  if (!orderCache.has(p)) { const r = await client.query<{ m: number }>(`SELECT COALESCE(MAX("order"),0) AS m FROM products_rels WHERE parent_id=$1`, [p]); orderCache.set(p, Number(r.rows[0].m)) }
  const n = orderCache.get(p)! + 1; orderCache.set(p, n); return n
}
async function relExists(p: number, path: string, col: string, v: number) { const r = await client.query(`SELECT 1 FROM products_rels WHERE parent_id=$1 AND path=$2 AND ${col}=$3 LIMIT 1`, [p, path, v]); return (r.rowCount ?? 0) > 0 }
async function insRel(p: number, path: string, col: string, v: number) { if (await relExists(p, path, col, v)) return false; await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [await nextOrder(p), p, path, v]); return true }

async function bwWardrobe2x2() {
  console.log('\n*) bw-wardrobe (#322) — clean 2x2 doors×door_material')
  // reuse iron's exact Persian label parts (ZWNJ-safe)
  const lg = (await client.query<{ label: string }>(`SELECT label FROM product_variants WHERE sku='iron-wardrobe-doors-1-door_material-glass'`)).rows[0]?.label || 'تعداد درب: ۱ · جنس درب: شیشه'
  const lm = (await client.query<{ label: string }>(`SELECT label FROM product_variants WHERE sku='iron-wardrobe-doors-2-door_material-mdf'`)).rows[0]?.label || 'تعداد درب: ۲ · جنس درب: ام‌دی‌اف'
  const doors1 = lg.split(' · ')[0], glassMat = lg.split(' · ')[1]
  const doors2 = lm.split(' · ')[0], mdfMat = lm.split(' · ')[1]
  // morph the two bare variants -> add door_material=mdf (their images already are the mdf shots)
  for (const [vid, doorsPart, sku] of [[234, doors1, 'bw-wardrobe-doors-1-door_material-mdf'], [236, doors2, 'bw-wardrobe-doors-2-door_material-mdf']] as [number, string, string][]) {
    const has = await client.query(`SELECT 1 FROM product_variants_axes WHERE _parent_id=$1 AND key='door_material'`, [vid])
    if ((has.rowCount ?? 0) > 0) { console.log(`   #${vid}: already has door_material — skip`); continue }
    const label = `${doorsPart} · ${mdfMat}`
    console.log(`   #${vid}: +door_material=mdf, sku=${sku}, label="${label}"`)
    if (APPLY) {
      await client.query(`INSERT INTO product_variants_axes ("_order","_parent_id",id,key,value) VALUES (1,$1,$2,'door_material','mdf')`, [vid, `${vid}-axis-1`])
      await client.query(`UPDATE product_variants SET sku=$1, label=$2, updated_at=NOW() WHERE id=$3`, [sku, label, vid]); updates++
    }
  }
  // create the missing (1,glass) on its image 367
  const sku = 'bw-wardrobe-doors-1-door_material-glass'
  if ((await client.query(`SELECT 1 FROM product_variants WHERE sku=$1`, [sku])).rowCount) console.log(`   ${sku}: exists — skip`)
  else {
    const label = `${doors1} · ${glassMat}`
    console.log(`   + ${sku} "${label}" img=367`)
    if (APPLY) {
      const r = await client.query<{ id: number }>(`INSERT INTO product_variants (product_id, sku, label, price_delta_rials, availability, image_id, display_order, created_at, updated_at) VALUES (322,$1,$2,0,'in_stock',367,5,NOW(),NOW()) RETURNING id`, [sku, label])
      const vid = r.rows[0].id
      await client.query(`INSERT INTO product_variants_axes ("_order","_parent_id",id,key,value) VALUES (0,$1,$2,'doors','1'),(1,$1,$3,'door_material','glass')`, [vid, `${vid}-axis-0`, `${vid}-axis-1`]); vcreated++
    }
  }
}

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-19-six-series  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===`)
  for (const d of DESIGNS) {
    const prods = (await client.query<{ id: number; slug: string; piece_type: string }>(`SELECT id, slug, piece_type FROM products WHERE design_id=$1`, [d.id])).rows
    console.log(`\n### ${d.slug} (${prods.length} products)`)
    // D1 publish
    for (const id of d.publish) {
      const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
      if (r.rows[0]?.status === 'draft') { console.log(`  publish #${id}`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    }
    // D2 tags
    for (const p of prods) if (APPLY && await insRel(p.id, 'tags', 'tags_id', TAG_MODERN)) inserts++
    for (const id of d.storage) if (APPLY && await insRel(id, 'tags', 'tags_id', TAG_STORAGE)) inserts++
    // D4 ogImage
    for (const p of prods) {
      const cur = await client.query<{ x: number | null }>(`SELECT seo_og_image_id x FROM products WHERE id=$1`, [p.id])
      if (cur.rows[0]?.x != null) continue
      const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
      if (g.rows[0]?.media_id && APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [g.rows[0].media_id, p.id]); updates++ }
    }
    // D3 cross-sell
    const pe: [number, number][] = []; for (const [a, b] of d.pairs) pe.push([a, b], [b, a])
    for (const [a, b] of pe) if (APPLY && await insRel(a, 'pairsWithProducts', 'products_id', b)) inserts++
    const ranked = [...prods].sort((x, y) => (PT_PRIO[x.piece_type] ?? 99) - (PT_PRIO[y.piece_type] ?? 99))
    for (const p of prods) { const rel = ranked.filter((o) => o.id !== p.id).slice(0, RELATED_CAP); for (const r of rel) if (APPLY && await insRel(p.id, 'relatedProducts', 'products_id', r.id)) inserts++ }
    // D5 bed placeholders
    for (const [vid, mid] of d.bedFix) {
      const r = await client.query<{ image_id: number | null }>(`SELECT image_id FROM product_variants WHERE id=$1`, [vid])
      if (r.rows[0] && r.rows[0].image_id == null) { console.log(`  bedFix variant #${vid} <- media #${mid}`); if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ } }
    }
    console.log(`  tags/og/cross-sell/bed-placeholders done (publish: ${d.publish.length})`)
  }
  await bwWardrobe2x2()
  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels, ${updates} updates, ${vcreated} variants created` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
