/**
 * Update the Home global's `brand_statement` rich text (the «از کارخونه،تا خونه»
 * copy on the homepage) with operator-supplied text. Kashida (tatweel ـ)
 * elongations are intentional and preserved verbatim.
 *
 * Usage:  pnpm --filter @zhic/api exec tsx scripts/update-brand-statement.mts
 *
 * Direct pg write (Payload local-API boot is broken on Node 24 — see
 * seed-rooms.mts). brand_statement is a jsonb Lexical-root column.
 */

import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
    if (!process.env[key]) process.env[key] = trimmed.slice(eqIdx + 1).trim()
  }
} catch {
  /* fall through to process.env */
}

const DATABASE_URI = process.env.DATABASE_URI
if (!DATABASE_URI) {
  console.error('DATABASE_URI not set')
  process.exit(1)
}

const PARAGRAPHS = [
  'شرکت هنر چوب ژیک، تولیدی سرویس خواب و وسایــــــل اتاق خواب است. ما هر تخت، پاتختی، میز آرایش و کمد را از چـــــــــــوب و ام‌دی‌اف باکیفیت با روکش وکیوم می‌سازیم و بدون واســــــــــــــطه، مستقیم از کارخانه به دست شما می‌رسانیم.',
  'باور ما این است که اتاق خواب آرام ‌تریـــــــــن گوشه‌ی خانه است؛ برای همین از طراحی تا تـــــــــحویل، به جزئیات وفاداریم؛ تا خوابی خوب و خانه‌ای زیبا داشته باشـــــید. نه بیشتر از آنچه لازم است می‌سازیم، نه کمتر از آنچه شایسته است.',
  'سرویس خواب ژیک همواره با گارانتی و ارسال به سراسر ایـــــــــــــــران عرضــــــــه مــــی‌شود.',
]

const text = (s: string) => ({ type: 'text', version: 1, text: s, format: 0, detail: 0, mode: 'normal', style: '' })
const paragraph = (s: string) => ({ type: 'paragraph', version: 1, direction: 'rtl', format: '', indent: 0, children: [text(s)] })
const brandStatement = {
  root: { type: 'root', version: 1, direction: 'rtl', format: '', indent: 0, children: PARAGRAPHS.map(paragraph) },
}

const client = new pg.Client({ connectionString: DATABASE_URI })
await client.connect()
try {
  const res = await client.query('UPDATE home SET brand_statement = $1', [JSON.stringify(brandStatement)])
  console.log(`Updated brand_statement on ${res.rowCount} home row(s).`)
} finally {
  await client.end()
}
