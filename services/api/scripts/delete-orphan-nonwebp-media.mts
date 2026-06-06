/**
 * One-off: delete the 4 orphaned non-webp media docs found in the 2026-06-06
 * audit — the PNG originals of the room covers (their webp twins are in use)
 * and the day-one test JPG. Verifies they're unreferenced is the caller's job
 * (done via API sweep before running). Idempotent.
 *
 * Run: cd services/api && npx tsx scripts/delete-orphan-nonwebp-media.mts
 */
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

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

const FILENAMES = [
  'IMG_0896.JPG',
  '8c271a60-3faf-477a-8353-39a63a077ea0.png',
  'ab58082b-db29-4d05-996b-8fa9b593c666.png',
  '3fa773ad-cde6-48a9-a699-ad046b36c67e.png',
]
for (const filename of FILENAMES) {
  const r = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
  if (r.docs[0]) {
    await payload.delete({ collection: 'media', id: r.docs[0].id })
    console.log('deleted', filename, '(id', r.docs[0].id + ')')
  } else {
    console.log('already gone:', filename)
  }
}
process.exit(0)
