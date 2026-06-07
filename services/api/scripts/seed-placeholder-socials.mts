/**
 * Seed placeholder social links + a contact phone on the site-config global so
 * the footer «ارتباط با ما» column looks complete for the review. Operator
 * overwrites these with the real handles in the admin. Idempotent: only fills
 * fields that are currently empty.
 *
 * Run: cd services/api && npx tsx scripts/seed-placeholder-socials.mts
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

const current = (await payload.findGlobal({ slug: 'site-config', depth: 0 })) as Record<string, unknown>

const data: Record<string, unknown> = {}
if (!Array.isArray(current.socials) || current.socials.length === 0) {
  data.socials = [
    { platform: 'instagram', url: 'https://instagram.com/zhicwood' },
    { platform: 'telegram', url: 'https://t.me/zhicwood' },
    { platform: 'whatsapp', url: 'https://wa.me/989120000000' },
  ]
}
if (!current.contactPhone) data.contactPhone = '۰۸۱-۳۴۲۵ ۶۷۸۹'

if (Object.keys(data).length === 0) {
  console.log('site-config already has socials/phone — nothing to do')
} else {
  await payload.updateGlobal({ slug: 'site-config', data })
  console.log('seeded:', Object.keys(data).join(', '))
}
process.exit(0)
