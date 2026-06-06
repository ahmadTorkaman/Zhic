/**
 * One-off: delete the borderless bedroom-set-parla-bunk-card.webp media doc so
 * seed-bedroom-set.mts re-uploads the rounded-poster version (uploadMedia
 * reuses docs by filename). Safe to re-run: no-op when the doc is gone.
 *
 * Run: pnpm --filter @zhic/api tsx scripts/delete-stale-bunk-card.mts
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

const r = await payload.find({
  collection: 'media',
  where: { filename: { equals: 'bedroom-set-parla-bunk-card.webp' } },
  limit: 1,
  depth: 0,
})
if (r.docs[0]) {
  await payload.delete({ collection: 'media', id: r.docs[0].id })
  console.log('deleted stale media', r.docs[0].id)
} else {
  console.log('no stale doc — nothing to do')
}
process.exit(0)
