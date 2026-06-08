/**
 * Reconcile Stage 1 — Mirror slug rename (table-mirror → console-vanity-mirror)
 *
 * Decision 2026-06-08: URL list (imports/zhicwood-url-list.xlsx) is the spec.
 * The desktop/vanity mirror's canonical slug is `console-vanity-mirror`
 * (آینه رومیزی), not the live `table-mirror`. See
 * docs/reports/url-list-vs-catalog-diff-2026-06-08.md.
 *
 * Changes (idempotent):
 *   - Category slug: table-mirror → console-vanity-mirror
 *   - ~20 product slugs: {series}-table-mirror → {series}-console-vanity-mirror
 *   - Their variant SKUs: {series}-table-mirror-* → {series}-console-vanity-mirror-*
 *
 * Run:  cd services/api && DRY=1 tsx scripts/reconcile-01-mirror-rename.mts   # preview
 *       cd services/api &&        tsx scripts/reconcile-01-mirror-rename.mts   # apply
 */
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const payloadUrl = pathToFileURL(`${payloadDir}/dist/index.js`).href

const DRY = !!process.env.DRY
const FROM = 'table-mirror'
const TO = 'console-vanity-mirror'
const ren = (s: string) => s.split(FROM).join(TO)

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

let changes = 0
const log = (msg: string) => console.log(`${DRY ? '[dry] ' : ''}${msg}`)

// 1) Category
const cats = await payload.find({
  collection: 'categories',
  where: { slug: { equals: FROM } },
  limit: 10,
  overrideAccess: true,
})
for (const c of cats.docs) {
  log(`category #${c.id}: ${c.slug} → ${TO}`)
  changes++
  if (!DRY) {
    await payload.update({ collection: 'categories', id: c.id, data: { slug: TO }, overrideAccess: true })
  }
}

// 2) Products whose slug ends with -table-mirror
const prods = await payload.find({
  collection: 'products',
  where: { slug: { like: FROM } },
  limit: 500,
  depth: 0,
  overrideAccess: true,
})
const mirrorProductIds: (number | string)[] = []
for (const p of prods.docs) {
  if (!p.slug?.endsWith(`-${FROM}`)) continue
  mirrorProductIds.push(p.id)
  const next = ren(p.slug)
  log(`product #${p.id}: ${p.slug} → ${next}`)
  changes++
  if (!DRY) {
    await payload.update({ collection: 'products', id: p.id, data: { slug: next }, overrideAccess: true })
  }
}

// 3) Variant SKUs on those products
if (mirrorProductIds.length) {
  const vars = await payload.find({
    collection: 'product-variants',
    where: { product: { in: mirrorProductIds } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  for (const v of vars.docs) {
    if (!v.sku?.includes(FROM)) continue
    const next = ren(v.sku)
    log(`variant #${v.id}: ${v.sku} → ${next}`)
    changes++
    if (!DRY) {
      await payload.update({ collection: 'product-variants', id: v.id, data: { sku: next }, overrideAccess: true })
    }
  }
}

log(`${DRY ? 'WOULD change' : 'changed'} ${changes} record(s).`)
process.exit(0)
