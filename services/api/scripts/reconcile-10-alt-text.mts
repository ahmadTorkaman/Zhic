/**
 * Reconcile Stage 10 — Generate per-image Persian alt text for in-use product
 * media (was empty on all 459). See docs/reports/product-media-audit-2026-06-08.md.
 *
 * Per-image differentiated: base = the owning product's Persian name; then
 * variant qualifiers parsed from the filename (count / material / colorway /
 * size) and a view marker (نمای محیطی for lifestyle "-picture", نمای داخلی for
 * "-open"). Only fills media whose alt is empty; only touches in-use media
 * (referenced by a product gallery). RTL Persian, ZWNJ-correct.
 *
 * NOTE: colorway/count are read from the filename, so the handful of known
 * mislabeled filenames (audit §3: loof "-cream" lifestyle shots actually green,
 * etc.) will inherit that label — regenerate after those are fixed.
 *
 * Run:  cd services/api && DRY=1 tsx scripts/reconcile-10-alt-text.mts
 *       cd services/api &&        tsx scripts/reconcile-10-alt-text.mts
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

const PIECE_FA: Record<string, string> = {
  bed: 'تخت', nightstand: 'پاتختی', closet: 'کمد', dresser: 'دراور', mirror: 'آینه',
  desk: 'میز تحریر', bookcase: 'کتابخانه', display_cabinet: 'ویترین', vanity: 'میز آرایش',
  chair: 'صندلی', console: 'کنسول', changing_table: 'میز تعویض', bracket: 'براکت', sofa: 'مبل',
}
const NUM_FA = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش']
const COLOR_FA: Record<string, string> = {
  cream: 'کرم', green: 'سبز', gray: 'خاکستری', grey: 'خاکستری', white: 'سفید',
  black: 'مشکی', walnut: 'گردویی', oak: 'بلوط',
}
const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])

function qualifiers(rest: string[]): string[] {
  const q: string[] = []
  // counts: "2-doors" / "3-drawers"
  for (let i = 0; i < rest.length - 1; i++) {
    const n = Number(rest[i])
    if (n >= 1 && n <= 6 && rest[i + 1] === 'doors') q.push(`${NUM_FA[n]} درب`)
    if (n >= 1 && n <= 6 && rest[i + 1] === 'drawers') q.push(`${NUM_FA[n]} کشو`)
  }
  if (rest.includes('mdf')) q.push('ام‌دی‌اف')
  if (rest.includes('glass')) q.push('شیشه‌ای')
  if (rest.includes('pieces')) {
    const i = rest.indexOf('pieces'); const n = Number(rest[i - 1])
    if (n >= 1 && n <= 6) q.push(`ست ${NUM_FA[n]}‌تکه`)
  }
  for (const t of rest) if (COLOR_FA[t]) { q.push(`رنگ ${COLOR_FA[t]}`); break }
  // size: a standalone 2-3 digit number (bed widths)
  for (const t of rest) if (/^\d{2,3}$/.test(t)) { q.push(`سایز ${faDigits(t)}`); break }
  // view marker
  if (rest.includes('open')) q.push('نمای داخلی')
  else if (rest.includes('picture')) q.push('نمای محیطی')
  return q
}

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

// products → media owner + base name
const prods = await payload.find({ collection: 'products', limit: 1000, depth: 1, overrideAccess: true })
const owner = new Map<number, { base: string; slug: string }>()
for (const p of prods.docs) {
  const designFa = typeof p.design === 'object' && p.design ? p.design.name : ''
  const base = p.name || `${PIECE_FA[p.piece_type as string] ?? 'محصول'} ${designFa}`.trim()
  for (const g of p.gallery ?? []) {
    const m = typeof g === 'object' ? g : null
    const id = m ? m.id : g
    if (!owner.has(id)) owner.set(id, { base, slug: p.slug }) // first owner wins
  }
}

let changes = 0
for (const [mid, { base, slug }] of owner) {
  const m = await payload.findByID({ collection: 'media', id: mid, depth: 0, overrideAccess: true })
  if (!m) continue
  if ((m.alt ?? '').trim()) continue // never overwrite existing alt
  const name = (m.filename as string).replace(/\.[a-z0-9]+$/i, '')
  const rest = (name.startsWith(slug + '-') ? name.slice(slug.length + 1) : name).split('-')
  const q = qualifiers(rest)
  const alt = q.length ? `${base} — ${q.join('، ')}` : base
  log(`media #${mid} ${m.filename}: alt = "${alt}"`)
  changes++
  if (!DRY) await payload.update({ collection: 'media', id: mid, data: { alt }, overrideAccess: true })
}
log(`${DRY ? 'WOULD set' : 'set'} alt on ${changes} media record(s).`)
process.exit(0)
