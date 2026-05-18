/**
 * Seed three default room entries (kid, teen, adult).
 *
 * Usage:
 *   pnpm --filter @zhic/api seed:rooms
 *
 * Idempotent — skips any room whose slug already exists.
 *
 * Why direct pg instead of Payload local API:
 *   The Payload boot path (`getPayload({ config })`) fails on Node 24 with the
 *   @next/env loadEnvConfig destructure error (FU-7.1). Direct pg writes work
 *   around it. cover + longDescription are left NULL for the operator to fill
 *   via the admin UI before publishing.
 */

import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load .env from services/api directory (dotenv-style manual parse)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env')
try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env not found — fall through to process.env
}

const DATABASE_URI = process.env.DATABASE_URI
if (!DATABASE_URI) {
  console.error('DATABASE_URI not set')
  process.exit(1)
}

const ROOM_SEEDS = [
  {
    slug: 'kid',
    name: 'اتاق کودک',
    tagline: 'سرویس‌ها و قطعات ایمن، با رنگ‌های آرام و قابل‌رشد همراه با کودک.',
  },
  {
    slug: 'teen',
    name: 'اتاق نوجوان',
    tagline: 'طراحی‌های منعطف برای سال‌های پر‌تغییر؛ از میز تحریر تا کتابخانه.',
  },
  {
    slug: 'adult',
    name: 'اتاق بزرگسال',
    tagline: 'سرویس‌های هماهنگ از گردوی ایرانی، برای آرامش بلندمدت.',
  },
]

const client = new pg.Client({ connectionString: DATABASE_URI })
await client.connect()

console.log('Seeding rooms...')

let errors = 0
try {
  for (const seed of ROOM_SEEDS) {
    try {
      const existing = await client.query(
        'SELECT id FROM rooms WHERE slug = $1',
        [seed.slug],
      )
      if (existing.rows.length > 0) {
        console.log(`  Room: ${seed.name} — skipped (already exists)`)
        continue
      }
      await client.query(
        'INSERT INTO rooms (name, slug, tagline, status, updated_at, created_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [seed.name, seed.slug, seed.tagline, 'draft'],
      )
      console.log(`  Room: ${seed.name} — created`)
    } catch (e: any) {
      errors++
      console.error(`  ✗ Room ${seed.slug}: ${e.message ?? e}`)
    }
  }
} finally {
  await client.end()
}

if (errors > 0) {
  console.error(`Rooms seed finished with ${errors} error(s).`)
  process.exit(1)
}
console.log('\nRooms seed complete!')
