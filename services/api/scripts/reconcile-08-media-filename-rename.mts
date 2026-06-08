/**
 * Reconcile Stage 8 — Media filename rename (F2): table-mirror -> console-vanity-mirror
 * Operator approved renaming media filenames (not just SKUs) to the canonical slug.
 * See docs/reports/product-media-audit-2026-06-08.md.
 *
 * Local-disk storage (no S3 in this env): rename the file in services/api/media/
 * AND update the media doc's `filename` + `url` (url embeds the filename).
 * Products reference media by ID, so galleries are unaffected.
 *
 * Run:  cd services/api && DRY=1 tsx scripts/reconcile-08-media-filename-rename.mts
 *       cd services/api && PILOT=698 tsx scripts/reconcile-08-media-filename-rename.mts  # one file
 *       cd services/api &&           tsx scripts/reconcile-08-media-filename-rename.mts  # all 15
 */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync, renameSync } from 'node:fs'

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const payloadUrl = pathToFileURL(`${payloadDir}/dist/index.js`).href

const DRY = !!process.env.DRY
const PILOT = process.env.PILOT ? Number(process.env.PILOT) : null
const MDIR = join(process.cwd(), 'media')
const FROM = 'table-mirror', TO = 'console-vanity-mirror'
const log = (m: string) => console.log(`${DRY ? '[dry] ' : ''}${m}`)

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

const res = await payload.find({
  collection: 'media',
  where: { filename: { like: FROM } },
  limit: 200, depth: 0, overrideAccess: true,
})

let changes = 0
for (const m of res.docs) {
  if (PILOT && m.id !== PILOT) continue
  const old = m.filename as string
  if (!old?.includes(FROM)) continue
  const next = old.split(FROM).join(TO)
  const oldPath = join(MDIR, old), newPath = join(MDIR, next)
  if (!existsSync(oldPath)) { log(`!! disk missing, skip: ${old}`); continue }
  if (existsSync(newPath)) { log(`!! target exists, skip: ${next}`); continue }
  const nextUrl = (m.url as string | null)?.split(FROM).join(TO) ?? undefined
  log(`media #${m.id}: ${old} -> ${next}`)
  changes++
  if (!DRY) {
    renameSync(oldPath, newPath)
    await payload.update({ collection: 'media', id: m.id, data: { filename: next, ...(nextUrl ? { url: nextUrl } : {}) }, overrideAccess: true })
  }
}
log(`${DRY ? 'WOULD rename' : 'renamed'} ${changes} media file(s).`)
process.exit(0)
