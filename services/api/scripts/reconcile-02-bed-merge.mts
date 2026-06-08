/**
 * Reconcile Stage 2 — Bed merge (split single/double → one {series}-bed + size axis)
 *
 * Decision 2026-06-08: URL list is the spec. Beds are ONE product per series
 * with a `size=` axis (90–120 = single, 140–180 = double). Category membership
 * (single #20 / double #21) is the union of whichever sizes exist.
 * See docs/reports/url-list-vs-catalog-diff-2026-06-08.md.
 *
 * Per series (23 total):
 *   - survivor = the double-bed record if present, else single-bed
 *   - absorb the other record's variants, then delete it
 *   - product: slug→{series}-bed, name→"تخت {SeriesFa}" (strip یک‌نفره/دونفره),
 *              sku→{series}-bed, basePriceRials→min effective price,
 *              categoryIds/occupancies/gallery = union, status=published if any
 *   - variants: re-point to survivor, sku prefix →{series}-bed,
 *               priceDeltaRials = effective − newBase (prices preserved exactly)
 *
 * Verified pre-flight: live sizes == spec sizes for all 23 series; 0 inbound
 * relatedProduct/pairsWith references to repoint.
 *
 * Run:  DRY=1 tsx scripts/reconcile-02-bed-merge.mts   # preview
 *              tsx scripts/reconcile-02-bed-merge.mts   # apply
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

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

const stripName = (n: string) =>
  n.replace(/(یک\s*نفره|یک‌نفره|دو\s*نفره|دونفره)\s*/g, '').replace(/\s+/g, ' ').trim()
const uniq = <T,>(a: T[]) => Array.from(new Set(a))

// load all beds + their variants
const prodRes = await payload.find({
  collection: 'products',
  where: { slug: { like: '-bed' } },
  limit: 500,
  depth: 0,
  overrideAccess: true,
})
const beds = prodRes.docs.filter((p: any) => /-(single|double)-bed$/.test(p.slug))

const varRes = await payload.find({
  collection: 'product-variants',
  limit: 2000,
  depth: 0,
  overrideAccess: true,
})
const varsByProduct = new Map<any, any[]>()
for (const v of varRes.docs) {
  const arr = varsByProduct.get(v.product) ?? []
  arr.push(v)
  varsByProduct.set(v.product, arr)
}

const series = new Map<string, { single?: any; double?: any }>()
for (const p of beds) {
  const m = p.slug.match(/^(.+?)-(single|double)-bed$/)
  const s = series.get(m[1]) ?? {}
  s[m[2] as 'single' | 'double'] = p
  series.set(m[1], s)
}

let prodUpdates = 0, varUpdates = 0, deletes = 0
const mixed: string[] = []

for (const [name, pair] of [...series.entries()].sort()) {
  const survivor = pair.double ?? pair.single
  const absorbed = pair.double && pair.single ? pair.single : undefined
  const all = [
    ...(varsByProduct.get(survivor.id) ?? []).map((v) => ({ v, base: survivor.basePriceRials })),
    ...(absorbed ? (varsByProduct.get(absorbed.id) ?? []).map((v) => ({ v, base: absorbed.basePriceRials })) : []),
  ]
  const effective = (x: { v: any; base: number }) => x.base + (x.v.priceDeltaRials ?? 0)
  const newBase = all.length ? Math.min(...all.map(effective)) : survivor.basePriceRials

  const newSlug = `${name}-bed`
  const newName = stripName(survivor.name)
  const cats = uniq([...(survivor.categoryIds ?? []), ...(absorbed?.categoryIds ?? [])])
  const occ = uniq([...(survivor.occupancies ?? []), ...(absorbed?.occupancies ?? [])])
  const gallery = uniq([...(survivor.gallery ?? []), ...(absorbed?.gallery ?? [])])
  const statuses = [survivor.status, absorbed?.status].filter(Boolean)
  const status = statuses.includes('published') ? 'published' : 'draft'
  if (absorbed && new Set(statuses).size > 1) mixed.push(name)
  const shortDescription = survivor.shortDescription || absorbed?.shortDescription || undefined
  const longDescription = survivor.longDescription ?? absorbed?.longDescription ?? undefined

  const sizes = uniq(all.flatMap((x) => (x.v.axes ?? []).filter((a: any) => a.key === 'size').map((a: any) => a.value)))
  log(
    `${name}: survivor=${survivor.slug}${absorbed ? ` +absorb ${absorbed.slug}` : ' (single-side only)'} → ${newSlug} ` +
      `"${newName}" base=${newBase} sizes=[${sizes.sort().join(',')}] cats=[${cats}] occ=[${occ}] gallery=${gallery.length} status=${status} variants=${all.length}`,
  )

  if (!DRY) {
    // 1) move + reprice variants
    for (const x of all) {
      const newDelta = effective(x) - newBase
      const newSku = x.v.sku
        .replace(`${name}-single-bed`, `${name}-bed`)
        .replace(`${name}-double-bed`, `${name}-bed`)
      await payload.update({
        collection: 'product-variants',
        id: x.v.id,
        data: { product: survivor.id, priceDeltaRials: newDelta, sku: newSku },
        overrideAccess: true,
      })
      varUpdates++
    }
    // 2) update survivor product
    await payload.update({
      collection: 'products',
      id: survivor.id,
      data: {
        slug: newSlug,
        name: newName,
        sku: newSlug,
        basePriceRials: newBase,
        categoryIds: cats,
        occupancies: occ,
        gallery,
        status,
        ...(shortDescription ? { shortDescription } : {}),
        ...(longDescription ? { longDescription } : {}),
      },
      overrideAccess: true,
    })
    prodUpdates++
    // 3) delete absorbed
    if (absorbed) {
      await payload.delete({ collection: 'products', id: absorbed.id, overrideAccess: true })
      deletes++
    }
  } else {
    prodUpdates++
    varUpdates += all.length
    if (absorbed) deletes++
  }
}

log(`series=${series.size}  product-updates=${prodUpdates}  variant-updates=${varUpdates}  deletes=${deletes}`)
if (mixed.length) log(`⚠ mixed-status series (one side was draft, merged→published): ${mixed.join(', ')}`)
process.exit(0)
