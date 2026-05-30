/**
 * Zhic branches (showrooms) importer — applies the real branch list from
 * /home/ahmad/imports/branches.xlsx to the `showrooms` collection.
 *
 *   --apply   Actually write. Default is a dry-run that prints the plan only.
 *
 *   pnpm --filter @zhic/api tsx scripts/import-branches.mts            # dry-run
 *   pnpm --filter @zhic/api tsx scripts/import-branches.mts --apply    # write
 *
 * Behaviour ("exact match" — confirmed by operator):
 *   - Upsert every sheet row by slug (insert new, update existing in place).
 *   - Rebuild each branch's `hours`: Sat–Thu open with the branch's own
 *     opens/closes, Friday closed. Mirrors the existing data convention.
 *   - Delete any showroom whose slug is NOT in the sheet (removes the demo
 *     rows: test, tehran, hamedan). Leaves the CMS == the sheet exactly.
 *
 * Why direct pg instead of Payload local API:
 *   Same Node-24 / Payload-boot bug documented in seed-rooms.mts and
 *   import-catalog.mts. cover / headline / description / email / manager
 *   fields are left NULL for the operator to fill via the admin UI.
 */

import pg from 'pg'
import xlsx from 'xlsx'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

// ───────────────────────── env + args ─────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env')
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
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

const XLSX_PATH = '/home/ahmad/imports/branches.xlsx'

// Sat–Thu open, Friday closed — matches the existing showrooms convention.
const DAY_ORDER = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const
const FRIDAY = 'fri'

// ───────────────────────── helpers ─────────────────────────

/** Coerce an xlsx time cell (numeric fraction-of-day, Date, or string) to HH:MM. */
function toHHMM(v: unknown): string | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') {
    const totalMin = Math.round(v * 24 * 60)
    const hh = Math.floor(totalMin / 60) % 24
    const mm = totalMin % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }
  if (v instanceof Date) {
    return `${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`
  }
  const s = String(v).trim()
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null
}

function str(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return /^(true|yes|1)$/i.test(String(v).trim())
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const oid = () => randomBytes(12).toString('hex') // Payload-style array row id

type Branch = {
  slug: string
  name: string
  city: string
  province: string | null
  address: string | null
  phone: string
  email: string | null
  is_central: boolean
  manager_name: string | null
  manager_phone: string | null
  opens: string | null
  closes: string | null
  lat: number | null
  lng: number | null
  gbp: string | null
  neshan: string | null
  mapEmbed: string | null
}

// ───────────────────────── read sheet ─────────────────────────

const wb = xlsx.readFile(XLSX_PATH)
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

const branches: Branch[] = []
const problems: string[] = []
for (const r of rows) {
  const slug = str(r.slug)
  const name = str(r.name)
  const city = str(r.city)
  const phone = str(r.phone)
  if (!slug || !name || !city || !phone) {
    problems.push(`Row skipped (missing slug/name/city/phone): ${JSON.stringify(r)}`)
    continue
  }
  branches.push({
    slug,
    name,
    city,
    province: str(r.province),
    address: str(r.address),
    phone,
    email: str(r.email),
    is_central: bool(r.is_central),
    manager_name: str(r.manager_name),
    manager_phone: str(r.manager_phone),
    opens: toHHMM(r.opens_morning),
    closes: toHHMM(r.closes_evening),
    lat: num(r.lat),
    lng: num(r.lng),
    gbp: str(r.googleBusinessProfileUrl),
    neshan: str(r.neshanProfileUrl),
    mapEmbed: str(r.mapEmbedUrl),
  })
}

const slugs = branches.map((b) => b.slug)
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
if (dupes.length) {
  console.error(`Duplicate slugs in sheet: ${[...new Set(dupes)].join(', ')}`)
  process.exit(1)
}
const centrals = branches.filter((b) => b.is_central).map((b) => b.slug)
if (centrals.length !== 1) {
  console.warn(`⚠ Expected exactly 1 central branch, sheet has ${centrals.length}: ${centrals.join(', ')}`)
}

// ───────────────────────── apply ─────────────────────────

const client = new pg.Client({ connectionString: DATABASE_URI })
await client.connect()

console.log(`\n${APPLY ? '🟢 APPLY' : '🟡 DRY-RUN'} — ${branches.length} branches from ${XLSX_PATH}`)
if (problems.length) problems.forEach((p) => console.warn(`  ⚠ ${p}`))
console.log(`  Central branch: ${centrals.join(', ') || '(none)'}\n`)

let created = 0
let updated = 0
let deleted = 0

try {
  if (APPLY) await client.query('BEGIN')

  for (const b of branches) {
    const existing = await client.query<{ id: number }>(
      'SELECT id FROM showrooms WHERE slug = $1',
      [b.slug],
    )
    const action = existing.rows.length ? 'update' : 'create'
    const hoursDesc = b.opens && b.closes ? `${b.opens}–${b.closes} (Sat–Thu), Fri closed` : 'no hours'
    console.log(`  ${action === 'create' ? '＋' : '↻'} ${b.slug.padEnd(20)} ${b.name}  [${hoursDesc}]${b.is_central ? '  ★central' : ''}`)

    if (!APPLY) {
      action === 'create' ? created++ : updated++
      continue
    }

    let id: number
    if (existing.rows.length) {
      id = existing.rows[0].id
      await client.query(
        `UPDATE showrooms SET
           name=$2, address_province=$3, address_city=$4, address_street=$5,
           geo_lat=$6, geo_lng=$7, phone=$8, email=$9,
           manager_name=$10, manager_phone=$11, is_central=$12,
           google_business_profile_url=$13, neshan_profile_url=$14, map_embed_url=$15,
           updated_at=NOW()
         WHERE id=$1`,
        [id, b.name, b.province, b.city, b.address, b.lat, b.lng, b.phone, b.email,
         b.manager_name, b.manager_phone, b.is_central, b.gbp, b.neshan, b.mapEmbed],
      )
      await client.query('DELETE FROM showrooms_hours WHERE _parent_id=$1', [id])
      updated++
    } else {
      const ins = await client.query<{ id: number }>(
        `INSERT INTO showrooms
           (name, slug, address_province, address_city, address_street,
            geo_lat, geo_lng, phone, email, manager_name, manager_phone, is_central,
            google_business_profile_url, neshan_profile_url, map_embed_url,
            updated_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
         RETURNING id`,
        [b.name, b.slug, b.province, b.city, b.address, b.lat, b.lng, b.phone, b.email,
         b.manager_name, b.manager_phone, b.is_central, b.gbp, b.neshan, b.mapEmbed],
      )
      id = ins.rows[0].id
      created++
    }

    // Rebuild hours: Sat–Thu open, Friday closed.
    for (let i = 0; i < DAY_ORDER.length; i++) {
      const day = DAY_ORDER[i]
      const closed = day === FRIDAY
      await client.query(
        `INSERT INTO showrooms_hours (_order, _parent_id, id, day, opens, closes, closed)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [i + 1, id, oid(), day, closed ? null : b.opens, closed ? null : b.closes, closed],
      )
    }
  }

  // Delete any showroom not in the sheet (exact-match — removes demo rows).
  const leftovers = await client.query<{ id: number; slug: string; name: string }>(
    `SELECT id, slug, name FROM showrooms WHERE slug <> ALL($1::text[])`,
    [slugs],
  )
  for (const l of leftovers.rows) {
    console.log(`  ✗ delete ${String(l.slug).padEnd(20)} ${l.name}`)
    if (APPLY) {
      await client.query('DELETE FROM showrooms_hours WHERE _parent_id=$1', [l.id])
      await client.query('DELETE FROM showrooms_holiday_hours WHERE _parent_id=$1', [l.id])
      await client.query('DELETE FROM showrooms_rels WHERE parent_id=$1', [l.id])
      await client.query('DELETE FROM showrooms WHERE id=$1', [l.id])
    }
    deleted++
  }

  if (APPLY) await client.query('COMMIT')
} catch (e) {
  if (APPLY) await client.query('ROLLBACK')
  console.error('\n✗ Failed, rolled back:', (e as Error).message)
  await client.end()
  process.exit(1)
} finally {
  // (end below)
}

const total = await client.query<{ n: string }>('SELECT count(*)::int AS n FROM showrooms')
await client.end()

console.log(`\n${APPLY ? 'Applied' : 'Would apply'}: ${created} created, ${updated} updated, ${deleted} deleted.`)
console.log(`showrooms now: ${total.rows[0].n} rows.`)
if (!APPLY) console.log('\nRe-run with --apply to write.')
