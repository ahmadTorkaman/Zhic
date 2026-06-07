/**
 * Restore the Arak showroom (deleted 2026-06-07 in error — its city
 * illustration DOES exist in the Figma file; the label-pairing missed it
 * because the «فهرست کامل» CTA text sat closer than the overlaid city name).
 * Recreates the doc from the pre-deletion API capture and attaches its cover.
 *
 * Idempotent: no-op when the slug already exists (cover still ensured).
 *
 * Run: cd services/api && npx tsx scripts/restore-arak-showroom.mts
 */
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'

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
} catch { /* fall through */ }

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const { getPayload } = await import(pathToFileURL(`${payloadDir}/dist/index.js`).href)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

// From the 2026-06-06 API capture (pre-deletion).
const ARAK = {
  name: 'شوروم اراک',
  slug: 'arak',
  address: {
    province: 'مرکزی',
    city: 'اراک',
    street: 'خیابان دکتر حسابی، رو به روی رستوران سید',
  },
  geo: { lat: 34.0917, lng: 49.6892 },
  phone: '086-32221447',
  hours: [
    { day: 'sat', opens: '10:00', closes: '21:00', closed: false },
    { day: 'sun', opens: '10:00', closes: '21:00', closed: false },
    { day: 'mon', opens: '10:00', closes: '21:00', closed: false },
    { day: 'tue', opens: '10:00', closes: '21:00', closed: false },
    { day: 'wed', opens: '10:00', closes: '21:00', closed: false },
    { day: 'thu', opens: '10:00', closes: '21:00', closed: false },
    { day: 'fri', opens: null, closes: null, closed: true },
  ],
}

// cover
const COVER_FILE = '/tmp/showroom-covers/showroom-arak.webp'
let coverId: number | string
const em = await payload.find({ collection: 'media', where: { filename: { equals: 'showroom-arak.webp' } }, limit: 1, depth: 0 })
if (em.docs[0]) {
  coverId = em.docs[0].id
  console.log('reuse cover', coverId)
} else {
  if (!existsSync(COVER_FILE)) throw new Error(`missing ${COVER_FILE}`)
  const doc = await payload.create({ collection: 'media', data: { alt: 'تصویرسازی شهر اراک' }, filePath: COVER_FILE })
  coverId = doc.id
  console.log('uploaded cover', coverId)
}

const existing = await payload.find({ collection: 'showrooms', where: { slug: { equals: 'arak' } }, limit: 1, depth: 0 })
if (existing.docs[0]) {
  await payload.update({ collection: 'showrooms', id: existing.docs[0].id, data: { cover: coverId } })
  console.log('arak already exists — cover ensured')
} else {
  const doc = await payload.create({ collection: 'showrooms', data: { ...ARAK, cover: coverId } })
  console.log('restored arak →', doc.id)
}
process.exit(0)
