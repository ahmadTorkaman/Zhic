/**
 * Reconcile 6 more series: shaylin, sento, jacqueline, celine, lorena, gandom.
 * (batch, operator-approved 2026-06-22)
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-20-six-more.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-20-six-more.mts --apply  # write
 *
 * Idempotent. Standard pass per design: D1 publish imaged drafts (price 0; image-less held),
 * D2 modern→all + storage→listed, D3 cross-sell (pairs + related cap 6), D4 seo.ogImage,
 * D5 bed placeholder images (SAME-CLASS closest only — never a single shot on a double size).
 * No finish-variant gap in any of the six.
 *
 * Note: sento-bed has only single-bed images, so sizes 140/160/180 are left image-less
 * (flagged for real double-bed photos) rather than stopgapped with a single shot.
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

const DESIGNS = [
  { slug: 'shaylin', id: 38, publish: [], storage: [553, 555, 558], pairs: [[552, 555], [558, 559], [558, 557]], bedFix: [[421, 878]] },
  { slug: 'sento', id: 37, publish: [], storage: [543, 544, 549, 551], pairs: [[542, 544], [549, 548], [547, 541]], bedFix: [[416, 862]] },
  { slug: 'jacqueline', id: 30, publish: [433], storage: [428, 429, 433, 434], pairs: [[427, 429], [433, 432], [431, 425]], bedFix: [[331, 554], [327, 551], [325, 551]] },
  { slug: 'celine', id: 25, publish: [], storage: [355, 356, 359], pairs: [[354, 356], [359, 360], [359, 358]], bedFix: [[267, 423]] },
  { slug: 'lorena', id: 32, publish: [458], storage: [453, 455], pairs: [[454, 455]], bedFix: [[349, 679]] },
  { slug: 'gandom', id: 28, publish: [], storage: [410, 412], pairs: [], bedFix: [] },
]

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
let inserts = 0, updates = 0
const orderCache = new Map<number, number>()
async function nextOrder(p: number) {
  if (!orderCache.has(p)) { const r = await client.query<{ m: number }>(`SELECT COALESCE(MAX("order"),0) AS m FROM products_rels WHERE parent_id=$1`, [p]); orderCache.set(p, Number(r.rows[0].m)) }
  const n = orderCache.get(p)! + 1; orderCache.set(p, n); return n
}
async function relExists(p: number, path: string, col: string, v: number) { const r = await client.query(`SELECT 1 FROM products_rels WHERE parent_id=$1 AND path=$2 AND ${col}=$3 LIMIT 1`, [p, path, v]); return (r.rowCount ?? 0) > 0 }
async function insRel(p: number, path: string, col: string, v: number) { if (await relExists(p, path, col, v)) return false; await client.query(`INSERT INTO products_rels ("order", parent_id, path, ${col}) VALUES ($1,$2,$3,$4)`, [await nextOrder(p), p, path, v]); return true }

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-20-six-more  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===`)
  for (const d of DESIGNS) {
    const prods = (await client.query<{ id: number; slug: string; piece_type: string }>(`SELECT id, slug, piece_type FROM products WHERE design_id=$1`, [d.id])).rows
    console.log(`\n### ${d.slug} (${prods.length} products, publish ${d.publish.length})`)
    for (const id of d.publish) {
      const r = await client.query<{ status: string }>(`SELECT status FROM products WHERE id=$1`, [id])
      if (r.rows[0]?.status === 'draft') { console.log(`  publish #${id}`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    }
    for (const p of prods) if (APPLY && await insRel(p.id, 'tagIds', 'tags_id', TAG_MODERN)) inserts++
    for (const id of d.storage) if (APPLY && await insRel(id, 'tagIds', 'tags_id', TAG_STORAGE)) inserts++
    for (const p of prods) {
      const cur = await client.query<{ x: number | null }>(`SELECT seo_og_image_id x FROM products WHERE id=$1`, [p.id])
      if (cur.rows[0]?.x != null) continue
      const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
      if (g.rows[0]?.media_id && APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [g.rows[0].media_id, p.id]); updates++ }
    }
    const pe: [number, number][] = []; for (const [a, b] of d.pairs) pe.push([a, b], [b, a])
    for (const [a, b] of pe) if (APPLY && await insRel(a, 'pairsWithProductIds', 'products_id', b)) inserts++
    const ranked = [...prods].sort((x, y) => (PT_PRIO[x.piece_type] ?? 99) - (PT_PRIO[y.piece_type] ?? 99))
    for (const p of prods) { const rel = ranked.filter((o) => o.id !== p.id).slice(0, RELATED_CAP); for (const r of rel) if (APPLY && await insRel(p.id, 'relatedProductIds', 'products_id', r.id)) inserts++ }
    for (const [vid, mid] of d.bedFix) {
      const r = await client.query<{ image_id: number | null }>(`SELECT image_id FROM product_variants WHERE id=$1`, [vid])
      if (r.rows[0] && r.rows[0].image_id == null) { console.log(`  bedFix variant #${vid} <- media #${mid}`); if (APPLY) { await client.query(`UPDATE product_variants SET image_id=$1, updated_at=NOW() WHERE id=$2`, [mid, vid]); updates++ } }
    }
    console.log(`  done`)
  }
  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels, ${updates} updates` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
