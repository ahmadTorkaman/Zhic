/**
 * Reconcile Stage 7 — Media/tagging fixes (DB-only, Group A safe set)
 * See docs/reports/product-media-audit-2026-06-08.md.
 *
 *  F1  rename 20 product SKUs  *-table-mirror -> *-console-vanity-mirror
 *      (Stage-1 mirror rename updated slugs + variant SKUs but missed product.sku)
 *  F3  attach orphaned *-picture images to their (zero-media) products
 *      (study-chair / vanity-chair sets). skate-vanity EXCLUDED — its matched
 *      orphans are vanity-CHAIR images (wrong piece, no skate-vanity-chair product).
 *  F6  elegance-nightstand: drop media #452 (a vanity+mirror unit, wrong piece);
 *      keep #451 (elegance-nightstand-v2, the correct nightstand).
 *
 * HELD (need a human call, see report): F2 media-filename rename (separate script),
 * F4 "* kesho*" files (real renders, no product home — don't delete), F5 elegance
 * mirror tangle, F7 sento-vanity label swap.
 *
 * Run:  cd services/api && DRY=1 tsx scripts/reconcile-07-media-tagging.mts
 *       cd services/api &&        tsx scripts/reconcile-07-media-tagging.mts
 */
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const payloadUrl = pathToFileURL(`${payloadDir}/dist/index.js`).href

const DRY = !!process.env.DRY
const log = (m: string) => console.log(`${DRY ? '[dry] ' : ''}${m}`)

// F3 — verified (product slug -> ordered media ids: base picture first, then v2..v4)
const ATTACH: Record<string, number[]> = {
  'bw-study-chair': [432, 430, 431],
  'caroline-study-chair': [436, 433, 434, 435],
  'iron-study-chair': [440, 437, 438, 439],
  'loof-study-chair': [444, 441, 442, 443],
  'lukaplus-vanity-chair': [445],
}

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

let changes = 0

// ── F1: product SKU rename ──
const skuProds = await payload.find({
  collection: 'products',
  where: { sku: { like: 'table-mirror' } },
  limit: 500, depth: 0, overrideAccess: true,
})
for (const p of skuProds.docs) {
  if (!p.sku?.includes('table-mirror')) continue
  const next = p.sku.split('table-mirror').join('console-vanity-mirror')
  log(`F1 product #${p.id} ${p.slug}: sku ${p.sku} -> ${next}`)
  changes++
  if (!DRY) await payload.update({ collection: 'products', id: p.id, data: { sku: next }, overrideAccess: true })
}

// ── F3: attach orphan images to zero-media products ──
for (const [slug, ids] of Object.entries(ATTACH)) {
  const res = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const p = res.docs[0]
  if (!p) { log(`F3 !! product not found: ${slug}`); continue }
  const cur = (p.gallery ?? []).map((g: any) => (typeof g === 'object' ? g.id : g))
  if (cur.length) { log(`F3 -- ${slug} already has ${cur.length} media, skipping`); continue }
  log(`F3 product #${p.id} ${slug}: gallery [] -> [${ids.join(',')}]`)
  changes++
  if (!DRY) await payload.update({ collection: 'products', id: p.id, data: { gallery: ids }, overrideAccess: true })
}

// ── F6: elegance-nightstand drop the wrong image ──
{
  const res = await payload.find({ collection: 'products', where: { slug: { equals: 'elegance-nightstand' } }, limit: 1, depth: 0, overrideAccess: true })
  const p = res.docs[0]
  if (p) {
    const cur = (p.gallery ?? []).map((g: any) => (typeof g === 'object' ? g.id : g))
    const next = cur.filter((id: number) => id !== 452)
    if (cur.join(',') !== next.join(',')) {
      log(`F6 product #${p.id} elegance-nightstand: gallery [${cur.join(',')}] -> [${next.join(',')}] (drop #452 vanity+mirror)`)
      changes++
      if (!DRY) await payload.update({ collection: 'products', id: p.id, data: { gallery: next }, overrideAccess: true })
    } else log(`F6 -- elegance-nightstand already correct`)
  }
}

log(`${DRY ? 'WOULD change' : 'changed'} ${changes} record(s).`)
process.exit(0)
