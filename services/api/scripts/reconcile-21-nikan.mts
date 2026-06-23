/**
 * Reconcile nikan series (design 45, 3 products). (operator-approved 2026-06-22)
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-21-nikan.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-21-nikan.mts --apply  # write
 *
 * Idempotent. Media for all 3 products was uploaded + wired via the CMS, so each
 * product already has a full gallery, variants, and a REAL price. They were just
 * draft. So: publish all 3 (they keep their real prices), modern→all + storage→wardrobe,
 * seed seo.ogImage, cross-sell related (no functional pairs exist in this 3-piece set).
 * No bed placeholders needed (bunk-bed variants are all imaged).
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
const DESIGN_ID = 45
const PUBLISH = [495, 496, 497]   // bunk-bed, study-desk, wardrobe — all complete, real prices
const STORAGE_PRODUCTS = [497]    // wardrobe
const RELATED_CAP = 6

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
  console.log(`\n=== reconcile-21-nikan  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===`)
  const prods = (await client.query<{ id: number; slug: string; piece_type: string }>(`SELECT id, slug, piece_type FROM products WHERE design_id=$1`, [DESIGN_ID])).rows
  for (const id of PUBLISH) {
    const r = await client.query<{ status: string; price: number }>(`SELECT status, base_price_rials price FROM products WHERE id=$1`, [id])
    if (r.rows[0]?.status === 'draft') { console.log(`  publish #${id} (price ${r.rows[0].price})`); if (APPLY) { await client.query(`UPDATE products SET status='published', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=$1`, [id]); updates++ } }
    else console.log(`  #${id} already ${r.rows[0]?.status}`)
  }
  for (const p of prods) if (APPLY && await insRel(p.id, 'tagIds', 'tags_id', TAG_MODERN)) inserts++
  for (const id of STORAGE_PRODUCTS) if (APPLY && await insRel(id, 'tagIds', 'tags_id', TAG_STORAGE)) inserts++
  for (const p of prods) {
    const cur = await client.query<{ x: number | null }>(`SELECT seo_og_image_id x FROM products WHERE id=$1`, [p.id])
    if (cur.rows[0]?.x != null) continue
    const g = await client.query<{ media_id: number }>(`SELECT media_id FROM products_rels WHERE parent_id=$1 AND path='gallery' AND media_id IS NOT NULL ORDER BY "order" LIMIT 1`, [p.id])
    if (g.rows[0]?.media_id && APPLY) { await client.query(`UPDATE products SET seo_og_image_id=$1, updated_at=NOW() WHERE id=$2`, [g.rows[0].media_id, p.id]); updates++ }
  }
  const ranked = [...prods].sort((a, b) => (PT_PRIO[a.piece_type] ?? 99) - (PT_PRIO[b.piece_type] ?? 99))
  for (const p of prods) { const rel = ranked.filter((o) => o.id !== p.id).slice(0, RELATED_CAP); for (const r of rel) if (APPLY && await insRel(p.id, 'relatedProductIds', 'products_id', r.id)) inserts++ }
  console.log(`\n=== ${APPLY ? `applied: ${inserts} rels, ${updates} updates (published ${PUBLISH.length})` : 'dry-run — re-run with --apply'} ===\n`)
  await client.end()
}
main().catch(async (e) => { console.error(e); try { await client.end() } catch {}; process.exit(1) })
