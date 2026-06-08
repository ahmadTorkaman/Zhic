/**
 * Reconcile Stage 4 — Convertibles (per-conversion products, spec model)
 *
 * Decision 2026-06-08: "go as the spreadsheet" — each conversion gets its own
 * product/URL. conversion (teen/sofa) moves from a variant axis into the slug;
 * any `finish` sub-axis is preserved. Display name gets a derived Persian
 * suffix: teen→(نوجوان), sofa→(کاناپه‌ای).
 *
 *   - single-conversion (7): rename {series}-convertible-bed → -teen/-sofa in place
 *   - caroline (teen+sofa): keep one record, clone a second for the other conversion
 *
 * Run:  DRY=1 tsx scripts/reconcile-04-convertibles.mts   # preview
 *              tsx scripts/reconcile-04-convertibles.mts   # apply
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
const QMAP: Record<string, string> = { teen: 'نوجوان', sofa: 'کاناپه‌ای' }

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

const prods = (
  await payload.find({ collection: 'products', where: { slug: { like: 'convertible-bed' } }, limit: 100, depth: 0, overrideAccess: true })
).docs.filter((p: any) => p.slug.endsWith('-convertible-bed'))

const allVars = (await payload.find({ collection: 'product-variants', limit: 2000, depth: 0, overrideAccess: true })).docs
const varsByProduct = new Map<any, any[]>()
for (const v of allVars) {
  const a = varsByProduct.get(v.product) ?? []
  a.push(v); varsByProduct.set(v.product, a)
}

let renamed = 0, created = 0, varUpd = 0

const reSku = (sku: string, series: string, conv: string) =>
  sku.replace(`${series}-convertible-bed`, `${series}-convertible-${conv}`).replace(`-conversion-${conv}`, '')
const stripConv = (axes: any[]) => (axes ?? []).filter((a: any) => a.key !== 'conversion').map((a: any) => ({ key: a.key, value: a.value }))

for (const p of prods.sort((a: any, b: any) => a.slug.localeCompare(b.slug))) {
  const series = p.slug.replace('-convertible-bed', '')
  const vs = varsByProduct.get(p.id) ?? []
  const convs = [...new Set(vs.flatMap((v: any) => (v.axes ?? []).filter((a: any) => a.key === 'conversion').map((a: any) => a.value)))].sort()
  if (!convs.length) { log(`${p.slug}: no conversion axis — skipped`); continue }

  for (let i = 0; i < convs.length; i++) {
    const conv = convs[i]
    const slug = `${series}-convertible-${conv}`
    const name = `${p.name} (${QMAP[conv] ?? conv})`
    const mine = vs.filter((v: any) => (v.axes ?? []).some((a: any) => a.key === 'conversion' && a.value === conv))

    if (i === 0) {
      log(`${p.slug} → ${slug} "${name}"  (reuse #${p.id}, ${mine.length} variant(s))`)
      renamed++
      if (!DRY) {
        await payload.update({ collection: 'products', id: p.id, data: { slug, name, sku: slug }, overrideAccess: true })
        for (const v of mine) {
          await payload.update({ collection: 'product-variants', id: v.id, data: { sku: reSku(v.sku, series, conv), axes: stripConv(v.axes) }, overrideAccess: true })
          varUpd++
        }
      } else varUpd += mine.length
    } else {
      log(`${p.slug} ⇒ NEW ${slug} "${name}"  (clone of #${p.id}, ${mine.length} variant(s))`)
      created++
      if (!DRY) {
        const np = await payload.create({
          collection: 'products',
          data: {
            name, slug, sku: slug,
            design: p.design, piece_type: p.piece_type,
            occupancies: p.occupancies ?? [], categoryIds: p.categoryIds ?? [],
            materialIds: p.materialIds ?? [], tagIds: p.tagIds ?? [],
            basePriceRials: p.basePriceRials ?? 0, salePriceRials: p.salePriceRials ?? undefined,
            availability: p.availability, leadTimeDays: p.leadTimeDays,
            warrantyYears: p.warrantyYears, afterSalesYears: p.afterSalesYears,
            dimensions: p.dimensions ?? undefined, gallery: p.gallery ?? [],
            shortDescription: p.shortDescription ?? undefined, longDescription: p.longDescription ?? undefined,
            inquiry_enabled: p.inquiry_enabled ?? true, status: p.status,
          },
          overrideAccess: true,
        })
        for (const v of mine) {
          await payload.update({ collection: 'product-variants', id: v.id, data: { product: np.id, sku: reSku(v.sku, series, conv), axes: stripConv(v.axes) }, overrideAccess: true })
          varUpd++
        }
      } else varUpd += mine.length
    }
  }
}

log(`renamed=${renamed}  created=${created}  variant-updates=${varUpd}`)
process.exit(0)
