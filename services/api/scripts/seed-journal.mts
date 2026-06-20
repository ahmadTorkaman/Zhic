/**
 * Seed the Journal global (صفحه ژورنال) — the curated /journal index config.
 *
 * Resets-and-seeds in one `updateGlobal`: every field is set explicitly from a
 * deterministic curation of the EXISTING articles (referenced by slug, resolved
 * to IDs at runtime — robust across environments) + all journal categories as
 * tabs, plus page-level Persian copy. Does NOT touch the Articles collection.
 *
 * Idempotent: re-running sets the same deterministic state. Errors loudly if any
 * curated slug is missing rather than silently dropping it.
 *
 * Run: pnpm --filter @zhic/api tsx scripts/seed-journal.mts
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

// ── Curation (by slug; resolved to IDs below) ───────────────────────────────
const FEATURED = 'bedroom-calm-design'
const LIST = ['wood-care-guide', 'guide-wood-selection', 'tahkhab-baray-do-nasl', 'handese-monabbat-tarrahi-emrooz']
const CARDS = ['cheraa-choob-gerdoo-irani', 'otaagh-dostane-do-farzand']
const CATEGORY_TABS = ['blog', 'materials-guide', 'lifestyle', 'care-maintenance']

async function articleId(slug: string): Promise<number> {
  const r = await payload.find({ collection: 'articles', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const doc = r.docs[0]
  if (!doc) throw new Error(`article slug not found: ${slug}`)
  return doc.id as number
}
async function categoryId(slug: string): Promise<number> {
  const r = await payload.find({ collection: 'journal-categories', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const doc = r.docs[0]
  if (!doc) throw new Error(`journal-category slug not found: ${slug}`)
  return doc.id as number
}

const featuredArticle = await articleId(FEATURED)
const listArticles = await Promise.all(LIST.map(articleId))
const cardArticles = await Promise.all(CARDS.map(articleId))
const categoryTabs = await Promise.all(CATEGORY_TABS.map(categoryId))

await payload.updateGlobal({
  slug: 'journal',
  overrideAccess: true,
  data: {
    introTitle: 'روایت‌هایی از چوب،\nخانه و آرامش',
    featuredArticle,
    listArticles,
    fullListHeading: 'فهرست کامل',
    quoteText: 'خانه جایی‌ست که چوب نفس می‌کشد و زمان آرام می‌گیرد.',
    cardArticles,
    categoryTabs,
    ctaTitle: 'ساخته شده برای ماندن',
    ctaLabel: 'مشاهده محصولات',
    ctaHref: '/bedroom-furniture',
  },
})

console.log('Journal global seeded:')
console.log('  featured:', FEATURED, '=>', featuredArticle)
console.log('  list:', LIST.join(', '), '=>', listArticles.join(','))
console.log('  cards:', CARDS.join(', '), '=>', cardArticles.join(','))
console.log('  tabs:', CATEGORY_TABS.join(', '), '=>', categoryTabs.join(','))
process.exit(0)
