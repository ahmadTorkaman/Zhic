/**
 * /bedroom-set SP1 seed: uploads the hub's name-mark logos + per-room-type card
 * variants + the two missing base cards (all webp, descriptively named) and links
 * them to the matching designs; flags a few flagship products as best-sellers; and
 * writes the hub's writing-section copy into the bedroom-set global.
 *
 * Idempotent: media is reused by filename, links/global are set deterministically.
 *
 * Run: pnpm --filter @zhic/api tsx scripts/seed-bedroom-set.mts
 */
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs'

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

const PUBLIC = '/home/ahmad/Zhic/apps/web/public/bedroom-set'
const TMP = '/tmp/bs-seed-media'
mkdirSync(TMP, { recursive: true })

const DESIGN_FA: Record<string, string> = {
  lotus: 'لوتوس', parla: 'پارلا', caroline: 'کارولین', iron: 'آیرون',
  jacqueline: 'ژاکلین', lukaplus: 'لوکاپلاس', loof: 'لوف', verna: 'ورنا',
}
const OCC_FA: Record<string, string> = { baby: 'نوزاد', teen: 'نوجوان', double: 'دونفره', bunk: 'دوطبقه' }

const LOGOS = ['lotus', 'parla', 'caroline', 'iron', 'jacqueline', 'lukaplus', 'loof']
const VARIANTS: Record<string, string[]> = {
  parla: ['baby', 'bunk'], caroline: ['double', 'teen'], lukaplus: ['double'], loof: ['baby'],
}
const MISSING_BASE = ['jacqueline', 'verna']

async function findDesignId(slug: string): Promise<number | string | null> {
  const r = await payload.find({ collection: 'designs', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  return r.docs[0]?.id ?? null
}
async function uploadMedia(srcName: string, destName: string, alt: string): Promise<number | string> {
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: destName } }, limit: 1, depth: 0 })
  if (existing.docs[0]) { console.log('  reuse  ', destName); return existing.docs[0].id }
  copyFileSync(`${PUBLIC}/${srcName}`, `${TMP}/${destName}`)
  const doc = await payload.create({ collection: 'media', data: { alt }, filePath: `${TMP}/${destName}` })
  console.log('  upload ', destName, '→', doc.id)
  return doc.id
}

let stats = { logos: 0, variants: 0, base: 0, featured: 0 }

// 1) name-mark logos → designs.logoMedia
console.log('— name-mark logos —')
for (const slug of LOGOS) {
  const id = await findDesignId(slug)
  if (!id) { console.log('  ⚠ no design', slug); continue }
  const media = await uploadMedia(`${slug}-logo.webp`, `bedroom-set-${slug}-namemark.webp`, `نام‌نشان طرح ${DESIGN_FA[slug]}`)
  await payload.update({ collection: 'designs', id, data: { logoMedia: media } })
  stats.logos++
}

// 2) per-room-type card variants → designs.occupancyMedia
console.log('— room-type card variants —')
for (const [slug, occs] of Object.entries(VARIANTS)) {
  const id = await findDesignId(slug)
  if (!id) { console.log('  ⚠ no design', slug); continue }
  const occupancyMedia = []
  for (const occ of occs) {
    const media = await uploadMedia(`${slug}-${occ}.webp`, `bedroom-set-${slug}-${occ}-card.webp`, `کارت سرویس ${OCC_FA[occ]} طرح ${DESIGN_FA[slug]}`)
    occupancyMedia.push({ occupancy: occ, image: media })
  }
  await payload.update({ collection: 'designs', id, data: { occupancyMedia } })
  stats.variants += occupancyMedia.length
}

// 3) two missing base cards → designs.sliderMedia (jacqueline, verna)
console.log('— missing base cards —')
for (const slug of MISSING_BASE) {
  const id = await findDesignId(slug)
  if (!id) { console.log('  ⚠ no design', slug); continue }
  const media = await uploadMedia(`${slug}.webp`, `bedroom-set-${slug}.webp`, `کارت طرح ${DESIGN_FA[slug]}`)
  await payload.update({ collection: 'designs', id, data: { sliderMedia: media } })
  stats.base++
}

// 3b) iron's sliderMedia points at a full-bleed landscape scene, not its rounded
// poster — every other hub design already uses the bedroom-set-*.webp rounded poster.
// Relink iron to its poster so the carousel art is consistent.
console.log('— iron: use the rounded poster, not the scene —')
{
  const id = await findDesignId('iron')
  const poster = await payload.find({ collection: 'media', where: { filename: { equals: 'bedroom-set-iron.webp' } }, limit: 1, depth: 0 })
  if (id && poster.docs[0]) {
    await payload.update({ collection: 'designs', id, data: { sliderMedia: poster.docs[0].id } })
    console.log('  iron sliderMedia →', poster.docs[0].id, '(bedroom-set-iron.webp)')
  } else {
    console.log('  ⚠ iron or its poster not found')
  }
}

// 4) best-sellers — one flagship bed PER design (varied), clearing any prior featured first
console.log('— best-sellers (featured products) —')
const prevFeatured = await payload.find({ collection: 'products', where: { featured: { equals: true } }, limit: 50, depth: 0 })
for (const p of prevFeatured.docs as any[]) {
  await payload.update({ collection: 'products', id: p.id, data: { featured: false } })
}
const flagship = ['parla', 'lotus', 'caroline', 'lukaplus', 'jacqueline', 'loof', 'iron']
let order = 1
for (const slug of flagship) {
  const did = await findDesignId(slug)
  if (!did) continue
  const prods = await payload.find({ collection: 'products', where: { design: { equals: did } }, limit: 50, depth: 1 })
  const bed = (prods.docs as any[]).find((p) => /bed/.test(p.slug) && (p.gallery || []).length > 0)
  if (!bed) continue
  await payload.update({ collection: 'products', id: bed.id, data: { featured: true, featuredOrder: order++ } })
  console.log('  featured', bed.slug)
  stats.featured++
  if (order > 5) break
}

// 5) writing-section copy → bedroom-set global
console.log('— writing copy (global) —')
await payload.updateGlobal({
  slug: 'bedroom-set',
  data: {
    writingHeading: 'درباره‌ی این سرویس‌ها',
    writingBody:
      'هر سرویس خواب ژیک از چوب گردوی ایرانی و با وسواس در جزئیات ساخته می‌شود؛ ' +
      'خطوطی آرام، رنگ‌هایی که با گذر سال‌ها همراه‌تان می‌مانند، و قطعاتی که از میز ' +
      'تحریر تا کتاب‌خانه کنار هم هماهنگ‌اند. این مجموعه برای آرامشی بلندمدت طراحی ' +
      'شده — جایی که کیفیت خواب، از کیفیت فضا آغاز می‌شود.',
  },
})
console.log('  global bedroom-set: written')

console.log('\nDONE', JSON.stringify(stats))
process.exit(0)
