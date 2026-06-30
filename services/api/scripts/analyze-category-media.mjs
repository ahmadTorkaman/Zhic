#!/usr/bin/env node
/**
 * analyze-category-media.mjs <category-slug>
 * For each published product in a category, prints:
 *   - current gallery[0] (the ProductMosaic tile photo) + on-disk + alpha
 *   - the transparent cutout candidate `<slug>.webp` (record? disk? alpha?)
 *   - available `<slug>-picture*` opaque scene records (on disk)
 * Reads DB via env PGURL-less psql through docker; here we read a pre-dumped
 * JSON of (filename->{onDisk,alpha}) is overkill — instead we shell to sharp.
 *
 * Usage: node scripts/analyze-category-media.mjs vanity-chair
 * Requires: a CSV at /home/ahmad/Zhic/ops/cat-products.csv with rows
 *   category_slug,product_slug,gallery0_filename
 * (produced by the caller via psql) — keeps DB creds out of this script.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
const require = createRequire(import.meta.url)
const sharp = require('sharp')

const CAT = process.argv[2]
if (!CAT) { console.error('usage: analyze-category-media.mjs <category-slug>'); process.exit(2) }
const MEDIA = '/home/ahmad/Zhic/services/api/media'
const rows = fs.readFileSync('/home/ahmad/Zhic/ops/cat-products.csv', 'utf8').trim().split('\n').slice(1)
  .map(l => l.split('|')).filter(r => r[0] === CAT)

const allFiles = new Set(fs.readdirSync(MEDIA))
async function info(fn) {
  if (!fn || !allFiles.has(fn)) return { disk: false, alpha: null }
  try { const m = await sharp(`${MEDIA}/${fn}`).metadata(); return { disk: true, alpha: !!m.hasAlpha } }
  catch { return { disk: true, alpha: null } }
}
const tag = (i) => !i.disk ? 'NO-FILE' : i.alpha ? 'transparent' : 'opaque'

console.log(`\n=== ${CAT} ===`)
for (const [, slug, g0] of rows) {
  const cutout = `${slug}.webp`
  const gi = await info(g0 || '')
  const ci = await info(cutout)
  const pics = [...allFiles].filter(f => f.startsWith(`${slug}-picture`)).sort()
  let line = `  ${slug.padEnd(34)} gallery0=${(g0 || '(none)').padEnd(40)}[${tag(gi)}]`
  line += `  cutout:${allFiles.has(cutout) ? tag(ci) : 'absent'}`
  if (pics.length) line += `  pics:${pics.length}`
  console.log(line)
}
