import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

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
