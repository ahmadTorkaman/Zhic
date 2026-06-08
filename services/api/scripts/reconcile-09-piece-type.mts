/**
 * Reconcile Stage 9 — Populate Products.piece_type (was empty on all 271).
 * Source: imports/zhicwood-url-list.xlsx Sheet1 product_type, mapped to the
 * coarse 14-value `piece_type` select enum (Products.ts). See
 * docs/reports/product-media-audit-2026-06-08.md.
 *
 * Piece token = product slug minus its design-slug prefix. All 27 live tokens
 * map below. Coarse-enum collapses (judgment calls noted): bed components
 * (bed-box/-guard/-jack) and all bed variants -> 'bed'; wardrobes -> 'closet';
 * all mirrors incl. console-vanity-mirror -> 'mirror'; file -> 'dresser';
 * wall-shelf -> 'bracket'; loveseat -> 'sofa'; study/vanity chairs -> 'chair'.
 *
 * Run:  cd services/api && DRY=1 tsx scripts/reconcile-09-piece-type.mts
 *       cd services/api &&        tsx scripts/reconcile-09-piece-type.mts
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

const MAP: Record<string, string> = {
  'baby-bed': 'bed', bed: 'bed', 'bed-box': 'bed', 'bed-guard': 'bed', 'bed-jack': 'bed',
  'bunk-bed': 'bed', 'convertible-sofa': 'bed', 'convertible-teen': 'bed',
  bookcase: 'bookcase',
  'changing-table': 'changing_table', 'changing-top': 'changing_table',
  wardrobe: 'closet', 'combined-wardrobe': 'closet', 'sliding-wardrobe': 'closet',
  console: 'console',
  'console-vanity-mirror': 'mirror', 'standing-mirror': 'mirror', 'wall-mirror': 'mirror',
  'display-cabinet': 'display_cabinet',
  file: 'dresser',
  loveseat: 'sofa',
  nightstand: 'nightstand',
  'study-chair': 'chair', 'vanity-chair': 'chair',
  'study-desk': 'desk',
  vanity: 'vanity',
  'wall-shelf': 'bracket',
}

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

const res = await payload.find({ collection: 'products', limit: 1000, depth: 1, overrideAccess: true })
let changes = 0
const unmapped = new Set<string>()
for (const p of res.docs) {
  const d = typeof p.design === 'object' && p.design ? p.design.slug : null
  const tok = d && p.slug.startsWith(d + '-') ? p.slug.slice(d.length + 1) : p.slug
  const next = MAP[tok]
  if (!next) { unmapped.add(`${p.slug} (token=${tok})`); continue }
  if (p.piece_type === next) continue
  log(`#${p.id} ${p.slug}: piece_type ${p.piece_type ?? 'null'} -> ${next}`)
  changes++
  if (!DRY) await payload.update({ collection: 'products', id: p.id, data: { piece_type: next }, overrideAccess: true })
}
if (unmapped.size) log(`!! UNMAPPED (${unmapped.size}): ${[...unmapped].join(', ')}`)
log(`${DRY ? 'WOULD set' : 'set'} piece_type on ${changes} product(s).`)
process.exit(0)
