/**
 * Journal cover importer — uploads the Figma journal-collage rectangles
 * (delivered via /home/ahmad/imports/journals-media.zip) as Media and sets
 * them as covers on the 9 newest journal articles.
 *
 *   --apply   Actually write. Default is a dry-run that prints the plan only.
 *
 *   pnpm --filter @zhic/api tsx scripts/set-journal-covers.mts            # dry-run
 *   pnpm --filter @zhic/api tsx scripts/set-journal-covers.mts --apply    # write
 *
 * Behaviour:
 *   - Converts each "Rectangle NN.png" to webp (q85, alpha flattened to
 *     white) directly into services/api/media/ as journal-rect-NN.webp.
 *   - Inserts a media row per file (skips when the filename already exists
 *     — idempotent), alt = the target article's title.
 *   - Sets articles.cover_id. Mapping below pairs image content with the
 *     article subject (teen desk → اتاق نوجوان, bunk room → دو فرزند, …);
 *     operator can reshuffle in the admin UI afterwards.
 *
 * Why direct pg instead of Payload local API:
 *   Same Node-24 / Payload-boot bug documented in seed-rooms.mts and
 *   import-catalog.mts.
 */

import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')
try {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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

const DATABASE_URI = process.env.DATABASE_URI
if (!DATABASE_URI) {
  console.error('DATABASE_URI not set')
  process.exit(1)
}

const { values: flags } = parseArgs({ options: { apply: { type: 'boolean', default: false } } })
const APPLY = flags.apply === true

const SRC_DIR = '/home/ahmad/imports/journals-media/journals-media'
const MEDIA_DIR = path.resolve(__dirname, '..', 'media')

/** rect number → article id. Targets the homepage's top-9 — the journal
 *  rows sort by publishedAt DESC (NOT by id): articles 11–19 as of
 *  2026-06-05. Pairings follow image content vs article subject. */
const MAPPING: Array<{ rect: number; articleId: number }> = [
  { rect: 57, articleId: 14 }, // teen room w/ bed+desk → تخت‌خوابی برای دو نسل
  { rect: 58, articleId: 17 }, // bunk room             → اتاق دوستانه برای دو فرزند
  { rect: 59, articleId: 16 }, // dark walnut study     → چرا چوب گردوی ایرانی؟
  { rect: 60, articleId: 19 }, // nursery set           → روایت یک سرویس از ابتدا تا نصب
  { rect: 61, articleId: 11 }, // white crib nursery    → راهنمای انتخاب چوب مناسب
  { rect: 62, articleId: 18 }, // wardrobe crop         → کمد و حافظه
  { rect: 63, articleId: 12 }, // warm calm bedroom     → طراحی اتاق خواب آرام (the Figma card's own title)
  { rect: 64, articleId: 15 }, // carved detail crop    → هندسه‌ی منبت در طراحی امروز
  { rect: 65, articleId: 13 }, // bright clean bedroom  → نگهداری از مبلمان چوبی
]

/** First --apply run (2026-06-05) targeted ids 17–25 by mistake (newest by
 *  id, not by publishedAt). The six articles below are NOT in the homepage
 *  top-9; their rect covers move to the articles above, and these reset to
 *  cover-less (their pre-import state) to avoid duplicate covers across
 *  the /journal listing. */
const RESET_COVER_IDS = [20, 21, 22, 23, 24, 25]

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URI })
  await client.connect()

  const articles = new Map<number, { title: string; cover_id: number | null }>()
  for (const r of (
    await client.query(`SELECT id, title, cover_id FROM articles WHERE id = ANY($1)`, [
      MAPPING.map((m) => m.articleId),
    ])
  ).rows) {
    articles.set(r.id, r)
  }

  console.log(`${APPLY ? '✍️  APPLY' : '🔍 DRY-RUN'} — journal covers`)
  if (!APPLY) console.log('(re-run with --apply to write)\n')

  if (APPLY && !fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true })

  for (const { rect, articleId } of MAPPING) {
    const article = articles.get(articleId)
    if (!article) {
      console.log(`  ✗ rect ${rect}: article ${articleId} not found — skipped`)
      continue
    }
    const srcPath = path.join(SRC_DIR, `Rectangle ${rect}.png`)
    if (!fs.existsSync(srcPath)) {
      console.log(`  ✗ rect ${rect}: ${srcPath} missing — skipped`)
      continue
    }
    const filename = `journal-rect-${rect}.webp`
    console.log(
      `  rect ${rect} → article ${articleId} «${article.title}»` +
        (article.cover_id ? ` (replaces cover ${article.cover_id})` : ''),
    )
    if (!APPLY) continue

    // Convert: flatten alpha to white, webp q85
    const targetPath = path.join(MEDIA_DIR, filename)
    await sharp(srcPath).flatten({ background: '#ffffff' }).webp({ quality: 85 }).toFile(targetPath)
    const stat = fs.statSync(targetPath)
    const meta = await sharp(targetPath).metadata()

    // Upsert media row by filename (idempotent re-runs)
    const existing = await client.query<{ id: number }>(
      `SELECT id FROM media WHERE filename = $1`,
      [filename],
    )
    let mediaId: number
    if (existing.rows.length > 0) {
      mediaId = existing.rows[0]!.id
      await client.query(`UPDATE media SET alt = $2, filesize = $3, width = $4, height = $5, updated_at = NOW() WHERE id = $1`, [
        mediaId,
        article.title,
        stat.size,
        meta.width ?? 0,
        meta.height ?? 0,
      ])
    } else {
      const r = await client.query<{ id: number }>(
        `INSERT INTO media (
          alt, filename, url, mime_type, filesize, width, height,
          focal_x, focal_y, created_at, updated_at
        ) VALUES ($1, $2, $3, 'image/webp', $4, $5, $6, 50, 50, NOW(), NOW())
        RETURNING id`,
        [
          article.title,
          filename,
          `/api/media/file/${filename}`,
          stat.size,
          meta.width ?? 0,
          meta.height ?? 0,
        ],
      )
      mediaId = r.rows[0]!.id
    }

    await client.query(`UPDATE articles SET cover_id = $2, updated_at = NOW() WHERE id = $1`, [
      articleId,
      mediaId,
    ])
    console.log(`    ↳ media ${mediaId} (${(stat.size / 1024).toFixed(0)} KB, ${meta.width}×${meta.height})`)
  }

  // Reset covers on articles whose rect moved to a homepage-top-9 article.
  const mappedIds = new Set(MAPPING.map((m) => m.articleId))
  const toReset = RESET_COVER_IDS.filter((id) => !mappedIds.has(id))
  if (toReset.length > 0) {
    console.log(`\n  resetting covers on articles: ${toReset.join(', ')}`)
    if (APPLY) {
      await client.query(
        `UPDATE articles SET cover_id = NULL, updated_at = NOW() WHERE id = ANY($1)`,
        [toReset],
      )
    }
  }

  await client.end()
  console.log(`\n${APPLY ? '✅ done' : '🔍 dry-run complete'}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
