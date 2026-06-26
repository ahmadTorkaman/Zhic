/**
 * Reconcile Stage 5 — Create bed-jack (the one genuinely-missing product)
 *
 * Decision 2026-06-08: create a draft skeleton now (price/media TBD by operator).
 * bed-jack is series-less, but Products.design is required → assign to a generic
 * `general` design (no media, no occupancies → stays OUT of the /bedroom-set
 * carousel, which filters designs by card image). Flag for a later schema call
 * on whether complement items should allow a null design.
 *
 * Creates (idempotent): general design, bed-jack product (draft, price 0),
 * size=100 + size=120 variants, in the bed-jack category.
 *
 * Run:  DRY=1 tsx scripts/reconcile-05-bed-jack.mts | tsx scripts/reconcile-05-bed-jack.mts
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

const findOne = async (collection: string, slug: string) =>
  (await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true })).docs[0]

// 1) generic design
let design = await findOne('designs', 'general')
if (design) {
  log(`design 'general' exists (#${design.id})`)
} else {
  log(`create design general "عمومی"`)
  if (!DRY) design = await payload.create({ collection: 'designs', data: { name: 'عمومی', slug: 'general', occupancies: [] }, overrideAccess: true })
}

// 2) bed-jack category id
const cat = await findOne('categories', 'bed-jack')
log(`bed-jack category: ${cat ? `#${cat.id}` : 'NOT FOUND'}`)

// 3) bed-jack product
let product = await findOne('products', 'bed-jack')
if (product) {
  log(`product bed-jack exists (#${product.id}) — skipping create`)
} else {
  log(`create product bed-jack "جک کفی تخت" (draft, price 0, cat ${cat?.id})`)
  if (!DRY) {
    product = await payload.create({
      collection: 'products',
      data: {
        name: 'جک کفی تخت', slug: 'bed-jack', sku: 'bed-jack',
        design: design.id,
        occupancies: [],
        categories: cat ? [cat.id] : [],
        basePriceRials: 0, availability: 'made_to_order', leadTimeDays: 56,
        warrantyYears: 5, afterSalesYears: 5, status: 'draft', inquiry_enabled: true,
      },
      overrideAccess: true,
    })
  }
}

// 4) size variants
if (!DRY && product) {
  for (const size of ['100', '120']) {
    const sku = `bed-jack-size-${size}`
    const existing = (await payload.find({ collection: 'product-variants', where: { sku: { equals: sku } }, limit: 1, overrideAccess: true })).docs[0]
    if (existing) { log(`variant ${sku} exists`); continue }
    await payload.create({ collection: 'product-variants', data: { product: product.id, sku, axes: [{ key: 'size', value: size }], priceDeltaRials: 0 }, overrideAccess: true })
    log(`create variant ${sku}`)
  }
} else if (DRY) {
  log('would create variants bed-jack-size-100, bed-jack-size-120')
}

log('done.')
process.exit(0)
