import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

// Load services/api/.env into process.env before payload.config is imported.
// Under tsx the @next/env auto-loader doesn't fire, so DATABASE_URI / PAYLOAD_SECRET
// would be missing and the Postgres connect fails ("client password must be a string").
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

const [, , email, password] = process.argv
if (!email || !password) {
  console.error('Usage: tsx scripts/reset-password.mts <email> <password>')
  process.exit(1)
}

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default

const payload = await getPayload({ config })

const found = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
})

if (found.docs.length === 0) {
  console.error(`No user with email ${email}`)
  process.exit(1)
}

const user = found.docs[0]
await payload.update({
  collection: 'users',
  id: user.id,
  data: { password },
})

console.log(`OK — password reset for ${email} (id=${user.id})`)
process.exit(0)
