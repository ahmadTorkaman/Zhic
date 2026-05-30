/**
 * One-off bulk seed: copy each product's design.occupancies onto product.occupancy.
 *
 * Default heuristic: every product inherits its design's occupancies. So a piece
 * whose design serves [teen, double] gets occupancy=[teen, double]. Operator
 * narrows later in /admin (mark a bed teen-only, a dresser double-only, etc.).
 *
 * Idempotent: skips any product that already has a non-empty occupancy array,
 * so re-running won't trample manual tagging.
 *
 * Run: pnpm --filter @zhic/api tsx scripts/seed-product-occupancies.mts
 */
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

// Load services/api/.env into process.env before payload.config is imported.
// Mirrors reset-password.mts — under tsx the @next/env auto-loader doesn't fire.
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  for (const line of readFileSync(resolve(__dirname, '../.env'), 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    if (!process.env[k]) process.env[k] = t.slice(i + 1).trim()
  }
} catch {
  /* fall through to process.env */
}

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const payloadUrl = pathToFileURL(`${payloadDir}/dist/index.js`).href

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default

const payload = await getPayload({ config })

// Pull every design once and index by id. Depth 0 keeps it skinny — we only
// need id + occupancies.
const designsPage = await payload.find({
  collection: 'designs',
  limit: 2000,
  depth: 0,
})
const designById = new Map<number | string, { occupancies?: string[] | null }>(
  designsPage.docs.map((d: any) => [d.id, d as { occupancies?: string[] | null }]),
)

const productsPage = await payload.find({
  collection: 'products',
  limit: 2000,
  depth: 0,
})

let updated = 0
let skippedAlreadySet = 0
let skippedNoDesign = 0
let skippedDesignNoOccupancies = 0

for (const product of productsPage.docs as any[]) {
  if (product.occupancies && Array.isArray(product.occupancies) && product.occupancies.length > 0) {
    skippedAlreadySet++
    continue
  }
  // `product.design` is the design ID (depth 0 = unpopulated relation).
  const designId = product.design as number | string | undefined
  if (designId == null) {
    skippedNoDesign++
    continue
  }
  const design = designById.get(designId)
  if (!design?.occupancies?.length) {
    skippedDesignNoOccupancies++
    continue
  }
  await payload.update({
    collection: 'products',
    id: product.id,
    data: { occupancies: design.occupancies },
    overrideAccess: true,
  })
  updated++
}

console.log(
  `Done. updated=${updated} ` +
    `skipped_already_set=${skippedAlreadySet} ` +
    `skipped_no_design=${skippedNoDesign} ` +
    `skipped_design_no_occupancies=${skippedDesignNoOccupancies} ` +
    `(of ${productsPage.docs.length} total products)`,
)
process.exit(0)
