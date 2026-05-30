import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const payloadUrl = pathToFileURL(`${payloadDir}/dist/index.js`).href

const [, , slug] = process.argv
if (!slug) {
  console.error('Usage: tsx scripts/publish-product.mts <slug>')
  process.exit(1)
}

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default

const payload = await getPayload({ config })

const found = await payload.find({
  collection: 'products',
  where: { slug: { equals: slug } },
  limit: 1,
  // Override access to find even drafts
  overrideAccess: true,
})

if (found.docs.length === 0) {
  console.error(`No product with slug "${slug}"`)
  process.exit(1)
}

const product = found.docs[0]
await payload.update({
  collection: 'products',
  id: product.id,
  data: { status: 'published' },
  overrideAccess: true,
})

console.log(`OK — product "${product.name}" (id=${product.id}, slug=${product.slug}) published`)
process.exit(0)
