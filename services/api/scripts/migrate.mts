import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const binUrl = pathToFileURL(`${payloadDir}/dist/bin/index.js`).href

const { bin } = await import(binUrl)
await bin()
