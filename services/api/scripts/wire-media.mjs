#!/usr/bin/env node
/**
 * wire-media.mjs — match a folder of source media files to Payload media
 * records by content fingerprint, and copy each into the Payload static dir
 * under the DB's (possibly dedup-renamed) filename.
 *
 * Matching is by content, not name:
 *   Pass 1  exact: basename === db.filename AND filesize === db.filesize
 *   Pass 2  fingerprint: (filesize, width, height, mime) unique match
 *
 * Usage:
 *   node ops/wire-media.mjs <incoming-dir> <target-dir> <db-media-csv> [--apply]
 * Without --apply it's a dry run (reports only, copies nothing).
 *
 * db-media-csv columns (header required): id,filename,filesize,width,height,mime_type
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const [, , INCOMING, TARGET, CSV, applyFlag] = process.argv
const APPLY = applyFlag === '--apply'
if (!INCOMING || !TARGET || !CSV) {
  console.error('usage: node wire-media.mjs <incoming-dir> <target-dir> <db-csv> [--apply]')
  process.exit(2)
}

// --- tiny CSV parser (handles quoted fields with commas) ---
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQ = false
      else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

const csvRows = parseCSV(fs.readFileSync(CSV, 'utf8')).filter(r => r.length > 1)
const header = csvRows.shift().map(h => h.trim())
const col = (name) => header.indexOf(name)
const cId = col('id'), cName = col('filename'), cSize = col('filesize'),
  cW = col('width'), cH = col('height'), cMime = col('mime_type')

const dbRecords = csvRows
  .filter(r => r[cName] && r[cName].trim() !== '')
  .map(r => ({
    id: r[cId],
    filename: r[cName],
    filesize: r[cSize] === '' ? null : Number(r[cSize]),
    width: r[cW] === '' ? null : Math.round(Number(r[cW])),
    height: r[cH] === '' ? null : Math.round(Number(r[cH])),
    mime: r[cMime] || '',
  }))

// --- walk incoming dir recursively ---
function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue // skip .DS_Store etc.
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (e.isFile()) out.push(p)
  }
  return out
}
const localPaths = walk(INCOMING)

// --- fingerprint each local file ---
async function dims(p, mimeHint) {
  // only probe images
  const ext = path.extname(p).toLowerCase()
  const imgExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.tiff', '.svg']
  if (!imgExt.includes(ext)) return { width: null, height: null }
  try {
    const m = await sharp(p, { failOn: 'none' }).metadata()
    return { width: m.width ?? null, height: m.height ?? null }
  } catch {
    return { width: null, height: null }
  }
}

const local = []
for (const p of localPaths) {
  const st = fs.statSync(p)
  const d = await dims(p)
  local.push({ path: p, base: path.basename(p), size: st.size, width: d.width, height: d.height })
}

// --- index DB by fingerprint and by name ---
const fp = (size, w, h) => `${size}|${w ?? '?'}|${h ?? '?'}`
const dbByFp = new Map()
const dbByName = new Map()
for (const r of dbRecords) {
  const k = fp(r.filesize, r.width, r.height)
  if (!dbByFp.has(k)) dbByFp.set(k, [])
  dbByFp.get(k).push(r)
  dbByName.set(r.filename, r)
}

const assigned = new Map()      // db.filename -> local file (the chosen source)
const usedLocal = new Set()     // local.path already assigned
const ambiguous = []            // {local, candidates:[db...]}

// Pass 1: exact name + size
for (const lf of local) {
  const r = dbByName.get(lf.base)
  if (r && !assigned.has(r.filename) && r.filesize === lf.size) {
    assigned.set(r.filename, lf); usedLocal.add(lf.path)
  }
}

// Pass 2: fingerprint match for still-unassigned DB records
for (const lf of local) {
  if (usedLocal.has(lf.path)) continue
  const cands = (dbByFp.get(fp(lf.size, lf.width, lf.height)) || [])
    .filter(r => !assigned.has(r.filename))
  if (cands.length === 1) {
    assigned.set(cands[0].filename, lf); usedLocal.add(lf.path)
  } else if (cands.length > 1) {
    // try to disambiguate by exact name; else flag
    const named = cands.find(r => r.filename === lf.base)
    if (named) { assigned.set(named.filename, lf); usedLocal.add(lf.path) }
    else ambiguous.push({ local: lf, candidates: cands })
  }
}

// --- results ---
const missing = dbRecords.filter(r => !assigned.has(r.filename))
const orphans = local.filter(lf => !usedLocal.has(lf.path))

// --- apply: copy assigned files into target under db filename ---
let copied = 0
if (APPLY) {
  fs.mkdirSync(TARGET, { recursive: true })
  for (const [dbName, lf] of assigned) {
    fs.copyFileSync(lf.path, path.join(TARGET, dbName))
    copied++
  }
}

// --- report ---
const pct = (n) => `${n}/${dbRecords.length} (${Math.round((n / dbRecords.length) * 100)}%)`
console.log('================ wire-media report ================')
console.log(`mode:            ${APPLY ? 'APPLY (files copied)' : 'DRY RUN (no copy)'}`)
console.log(`incoming files:  ${local.length}`)
console.log(`db media records:${dbRecords.length}`)
console.log(`matched:         ${pct(assigned.size)}`)
if (APPLY) console.log(`copied:          ${copied}`)
console.log(`missing (no file for db record): ${missing.length}`)
console.log(`orphan local files (no db match):${orphans.length}`)
console.log(`ambiguous (size+dims collision): ${ambiguous.length}`)
console.log('---------------------------------------------------')
if (missing.length) {
  console.log('\nMISSING — db records with no matching source file:')
  for (const r of missing.slice(0, 60))
    console.log(`  [${r.id}] ${r.filename}  (${r.filesize}b ${r.width}x${r.height} ${r.mime})`)
  if (missing.length > 60) console.log(`  ...and ${missing.length - 60} more`)
}
if (orphans.length) {
  console.log('\nORPHANS — source files matching no db record:')
  for (const lf of orphans.slice(0, 60))
    console.log(`  ${path.relative(INCOMING, lf.path)}  (${lf.size}b ${lf.width}x${lf.height})`)
  if (orphans.length > 60) console.log(`  ...and ${orphans.length - 60} more`)
}
if (ambiguous.length) {
  console.log('\nAMBIGUOUS — pick manually (same size+dims, names differ):')
  for (const a of ambiguous)
    console.log(`  ${path.relative(INCOMING, a.local.path)} -> [${a.candidates.map(c => c.filename).join(' | ')}]`)
}
// machine-readable summary for follow-up tooling
fs.writeFileSync(path.join(path.dirname(CSV), 'wire-media-result.json'), JSON.stringify({
  matched: [...assigned].map(([db, lf]) => ({ db, src: lf.path })),
  missing, orphans: orphans.map(o => ({ path: o.path, size: o.size, width: o.width, height: o.height })),
  ambiguous: ambiguous.map(a => ({ src: a.local.path, candidates: a.candidates.map(c => c.filename) })),
}, null, 2))
console.log('\nwrote wire-media-result.json')
