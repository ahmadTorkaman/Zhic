import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const payloadUrl = pathToFileURL(`${payloadDir}/dist/index.js`).href

const [, , slug, ...axes] = process.argv
if (!slug || axes.length === 0) {
  console.error('Usage: tsx scripts/set-allowed-axes.mts <category-slug> <axis1> <axis2> ...')
  process.exit(1)
}

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default

const payload = await getPayload({ config })

const found = await payload.find({
  collection: 'categories',
  where: { slug: { equals: slug } },
  limit: 1,
  overrideAccess: true,
})

if (found.docs.length === 0) {
  console.error(`No category with slug "${slug}"`)
  process.exit(1)
}

const cat = found.docs[0]
await payload.update({
  collection: 'categories',
  id: cat.id,
  data: { allowed_axes: axes },
  overrideAccess: true,
})

console.log(`OK — category "${cat.name}" (id=${cat.id}) allowed_axes set to [${axes.join(', ')}]`)
process.exit(0)
