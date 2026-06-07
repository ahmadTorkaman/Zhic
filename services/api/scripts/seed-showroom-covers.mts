/**
 * Showroom city-illustration covers (Figma "zhic wood .com", 2026-06-07 batch).
 * Uploads /tmp/showroom-covers/showroom-{city}.webp and attaches them as
 * showrooms.cover by slug; both Hamedan branches share the same illustration.
 * Removes the showrooms whose city has no illustration in the Figma file
 * (CEO directive 2026-06-07): arak, ardabil, behnamir.
 *
 * Idempotent: media reused by filename, deletes no-op when already gone.
 *
 * Run: cd services/api && npx tsx scripts/seed-showroom-covers.mts
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

const SRC = '/tmp/showroom-covers'

// showroom slug → cover file city key + Persian city (for alt text)
const COVERS: Record<string, { file: string; fa: string }> = {
  'mashhad':            { file: 'mashhad',      fa: 'مشهد' },
  'bandar-abbas':       { file: 'bandar-abbas', fa: 'بندرعباس' },
  'babol-amirkala':     { file: 'babol',        fa: 'بابل' },
  'isfahan':            { file: 'isfahan',      fa: 'اصفهان' },
  'urmia':              { file: 'urmia',        fa: 'ارومیه' },
  'tabriz':             { file: 'tabriz',       fa: 'تبریز' },
  'bukan':              { file: 'bukan',        fa: 'بوکان' },
  'sanandaj':           { file: 'sanandaj',     fa: 'سنندج' },
  'saveh':              { file: 'saveh',        fa: 'ساوه' },
  'rasht':              { file: 'rasht',        fa: 'رشت' },
  'kermanshah':         { file: 'kermanshah',   fa: 'کرمانشاه' },
  'qom':                { file: 'qom',          fa: 'قم' },
  'lahijan':            { file: 'lahijan',      fa: 'لاهیجان' },
  'sari':               { file: 'sari',         fa: 'ساری' },
  'hamedan-maryanaj':   { file: 'hamedan',      fa: 'همدان' },
  'hamedan-taleghani':  { file: 'hamedan',      fa: 'همدان' },
}

// Cities with no illustration in the Figma file → showroom removed.
const REMOVE = ['arak', 'ardabil', 'behnamir']

async function uploadCover(file: string, fa: string): Promise<number | string> {
  const filename = `showroom-${file}.webp`
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
  if (existing.docs[0]) { console.log('  reuse  ', filename); return existing.docs[0].id }
  const path = `${SRC}/${filename}`
  if (!existsSync(path)) throw new Error(`missing source file ${path}`)
  const doc = await payload.create({ collection: 'media', data: { alt: `تصویرسازی شهر ${fa}` }, filePath: path })
  console.log('  upload ', filename, '→', doc.id)
  return doc.id
}

console.log('— covers —')
const mediaCache = new Map<string, number | string>()
for (const [slug, { file, fa }] of Object.entries(COVERS)) {
  const r = await payload.find({ collection: 'showrooms', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const s = r.docs[0]
  if (!s) { console.log('  ⚠ no showroom', slug); continue }
  if (!mediaCache.has(file)) mediaCache.set(file, await uploadCover(file, fa))
  await payload.update({ collection: 'showrooms', id: s.id, data: { cover: mediaCache.get(file) } })
  console.log('  cover  ', slug)
}

console.log('— removals (no city illustration) —')
for (const slug of REMOVE) {
  const r = await payload.find({ collection: 'showrooms', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (r.docs[0]) {
    await payload.delete({ collection: 'showrooms', id: r.docs[0].id })
    console.log('  removed', slug)
  } else {
    console.log('  already gone:', slug)
  }
}
console.log('DONE')
process.exit(0)
