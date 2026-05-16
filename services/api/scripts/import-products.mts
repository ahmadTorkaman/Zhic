/**
 * Bulk product import from the legacy WooCommerce xlsx.
 *
 * Usage:
 *   pnpm --filter @zhic/api tsx scripts/import-products.mts --file /tmp/zhic-upload.xls
 *   pnpm --filter @zhic/api tsx scripts/import-products.mts --file /tmp/zhic-upload.xls --apply
 *
 * Default mode is DRY-RUN (no DB writes). Pass --apply to actually create/update.
 *
 * Why direct pg instead of Payload local API:
 *   The Payload boot path (`getPayload({ config })`) currently fails on Node 24
 *   with the @next/env loadEnvConfig destructure error (FU-7.1). Direct pg
 *   writes work around it. Trade-off: we bypass Payload's beforeValidate /
 *   beforeChange hooks. For this import that's acceptable — we generate slugs
 *   ourselves and the other hooks (e.g., reading-time) are on different
 *   collections (Articles).
 *
 * Idempotency: re-running is safe. Existing products are updated; existing
 * designs/categories are reused (matched by name).
 */

import pg from 'pg'
import xlsx from 'xlsx'
import { parseArgs } from 'node:util'

// ───────────────────────── Mapping rules ─────────────────────────

const PIECE_RULES: Array<[RegExp, string]> = [
  // Mirror — handles both Persian spellings (آینه and آیینه)
  [/^(آینه|آیینه)/, 'mirror'],
  [/^کابین میز تحریر/, 'desk'],
  [/^میز تحریر/, 'desk'],
  [/^میز\s*آرایش/, 'vanity'],
  [/^میز تعویض/, 'changing_table'],
  [/^صفحه تعویض/, 'changing_table'],
  [/^باکس تخت/, 'bed'],
  [/^تخت/, 'bed'],
  [/^کمد/, 'closet'],
  [/^کتابخانه/, 'bookcase'],
  [/^پاتختی/, 'nightstand'],
  [/^(دراور|فایل)/, 'dresser'],
  [/^ویترین/, 'display_cabinet'],
  [/^کنسول/, 'console'],
  [/^صندلی/, 'chair'],
  // Wall-mounted accessories (wall box, shelf, infant shelf) → bracket
  [/^(براکت|باکس دیواری|شلف)/, 'bracket'],
  [/^لاوست/, 'sofa'],
  // Fallback: anything containing "تخت" anywhere (e.g., "(طرح نوزادی) تخت 90*200")
  [/تخت/, 'bed'],
]

const CATEGORY_MAP: Record<string, { name: string; slug: string }> = {
  'خرید سرویس خواب کودک و نوجوان': {
    name: 'سرویس خواب کودک و نوجوان',
    slug: 'children-teen-bedroom-set',
  },
  'خرید سرویس خواب دو طبقه': {
    name: 'سرویس خواب دو طبقه',
    slug: 'bunk-bedroom-set',
  },
  'مدل های پسرانه + دخترانه': {
    name: 'مدل پسرانه و دخترانه',
    slug: 'boys-and-girls',
  },
}

const DESIGN_NAME_ALIASES: Record<string, string> = {
  'بلک اند وایت': 'Black & White',
}

const SKIP_TOKENS = new Set<string>([
  'شیک، مقاوم و صرفه جویی در فضا',
])

const DEFAULT_LEAD_TIME_DAYS = 14

// ───────────────────────── Helpers ─────────────────────────

type Row = {
  id: string | number
  title: string
  sku: string
  price: number
  regular_price: number
  sale_price: number
  stock_status: string
  categories: string
  image_folder: string
  image_file: string
  link: string
}

function parseTitle(title: string): { design: string; piece: string } {
  const idx = title.indexOf(' - ')
  if (idx < 0) return { design: title.trim(), piece: '' }
  return { design: title.slice(0, idx).trim(), piece: title.slice(idx + 3).trim() }
}

function detectPieceType(pieceLabel: string): string | null {
  for (const [rx, val] of PIECE_RULES) {
    if (rx.test(pieceLabel)) return val
  }
  return null
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9؀-ۿ‌‍-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function mapAvailability(stock: string): string {
  if (stock === 'instock') return 'in_stock'
  return 'made_to_order'
}

function parseCategoriesCell(cell: string, designNames: Set<string>): string[] {
  if (!cell) return []
  const tokens = String(cell).split('|').map((t) => t.trim()).filter(Boolean)
  return tokens.filter((t) => {
    if (SKIP_TOKENS.has(t)) return false
    if (designNames.has(t)) return false
    if (detectPieceType(t)) return false
    return Boolean(CATEGORY_MAP[t])
  })
}

// ───────────────────────── Main ─────────────────────────

const { values: args } = parseArgs({
  options: {
    file: { type: 'string', default: '/tmp/zhic-upload.xls' },
    apply: { type: 'boolean', default: false },
  },
})

const DRY = !args.apply
const FILE = args.file as string

console.log(`\n${'═'.repeat(60)}`)
console.log(`Zhic product import — ${DRY ? '🔍 DRY RUN (no writes)' : '✍️  APPLY MODE (live)'}`)
console.log(`File: ${FILE}`)
console.log(`${'═'.repeat(60)}\n`)

const wb = xlsx.readFile(FILE)
const rows = xlsx.utils.sheet_to_json<Row>(wb.Sheets['Upload'], { defval: null, raw: true })
console.log(`Parsed ${rows.length} rows from "Upload" sheet`)

const designNamesInXlsx = new Set<string>(rows.map((r) => parseTitle(String(r.title || '')).design))
console.log(`Distinct design names in titles: ${designNamesInXlsx.size}`)

type ParsedRow = {
  rawTitle: string
  designName: string
  pieceLabel: string
  pieceType: string | null
  categoriesPersian: string[]
  basePriceRials: number
  salePriceRials: number | null
  availability: string
  name: string
  slug: string
  sku: string
}

const parsed: ParsedRow[] = rows.map((row) => {
  const { design, piece } = parseTitle(String(row.title || ''))
  const sku = String(row.sku ?? '').trim()
  const name = String(row.title || '').trim()
  const regular = Math.round(Number(row.regular_price) || 0)
  const sale = Math.round(Number(row.sale_price) || 0)
  return {
    rawTitle: row.title,
    designName: design,
    pieceLabel: piece,
    pieceType: detectPieceType(piece),
    categoriesPersian: parseCategoriesCell(String(row.categories || ''), designNamesInXlsx),
    basePriceRials: regular,
    salePriceRials: sale && sale !== regular ? sale : null,
    availability: mapAvailability(String(row.stock_status || '')),
    name,
    slug: slugify(name) || `product-${sku}`,
    sku,
  }
})

const nullPiece = parsed.filter((p) => p.pieceType === null)
if (nullPiece.length > 0) {
  console.log(`\n⚠️  ${nullPiece.length} row(s) with unresolved piece_type:`)
  for (const p of nullPiece.slice(0, 10)) console.log(`     "${p.rawTitle}" → piece label "${p.pieceLabel}"`)
  if (nullPiece.length > 10) console.log(`     ... and ${nullPiece.length - 10} more`)
}

// ───────────────────────── DB connect + pre-fetch ─────────────────────────

const client = new pg.Client({ connectionString: 'postgresql://zhic:zhic_staging_pw_2026@127.0.0.1:5433/zhic' })
await client.connect()

const designsRes = await client.query<{ id: number; name: string; slug: string }>('SELECT id, name, slug FROM designs')
const categoriesRes = await client.query<{ id: number; name: string; slug: string }>('SELECT id, name, slug FROM categories')
const productsRes = await client.query<{ id: number; sku: string }>('SELECT id, sku FROM products')

const designByName = new Map<string, { id: number; name: string; slug: string }>()
for (const d of designsRes.rows) designByName.set(d.name, d)
const categoryByName = new Map<string, { id: number; name: string; slug: string }>()
for (const c of categoriesRes.rows) categoryByName.set(c.name, c)
const productBySku = new Map<string, { id: number; sku: string }>()
for (const p of productsRes.rows) productBySku.set(p.sku, p)

console.log(`\nExisting in DB: ${designsRes.rows.length} designs, ${categoriesRes.rows.length} categories, ${productsRes.rows.length} products`)

// ───────────────────────── Resolve designs ─────────────────────────

const designResolution = new Map<string, { id: number | null; mode: 'existing' | 'create' }>()
for (const name of designNamesInXlsx) {
  const aliased = DESIGN_NAME_ALIASES[name] ?? name
  const existing = designByName.get(aliased) ?? designByName.get(name)
  if (existing) {
    designResolution.set(name, { id: existing.id, mode: 'existing' })
  } else {
    designResolution.set(name, { id: null, mode: 'create' })
  }
}

const designsToCreate = [...designResolution.entries()].filter(([, v]) => v.mode === 'create').map(([k]) => k)
console.log(`\nDesigns: ${designResolution.size - designsToCreate.length} existing, ${designsToCreate.length} to create`)
for (const name of designsToCreate) console.log(`  + ${name}`)

// ───────────────────────── Resolve categories ─────────────────────────

const categoryResolution = new Map<string, { id: number | null; mode: 'existing' | 'create' }>()
const allCategoriesUsed = new Set<string>()
for (const p of parsed) for (const c of p.categoriesPersian) allCategoriesUsed.add(c)
for (const xlsxToken of allCategoriesUsed) {
  const target = CATEGORY_MAP[xlsxToken]
  if (!target) continue
  const existing = categoryByName.get(target.name)
  categoryResolution.set(xlsxToken, existing ? { id: existing.id, mode: 'existing' } : { id: null, mode: 'create' })
}

const categoriesToCreate = [...categoryResolution.entries()].filter(([, v]) => v.mode === 'create').map(([k]) => CATEGORY_MAP[k])
console.log(`\nCategories: ${categoryResolution.size - categoriesToCreate.length} existing, ${categoriesToCreate.length} to create`)
for (const c of categoriesToCreate) console.log(`  + ${c.name} (slug: ${c.slug})`)

// ───────────────────────── Products: classify ─────────────────────────

let toCreate = 0
let toUpdate = 0
for (const p of parsed) {
  if (productBySku.has(p.sku)) toUpdate++
  else toCreate++
}
console.log(`\nProducts: ${toCreate} to create, ${toUpdate} to update (by SKU match)`)

// Sample first 3 rows
console.log(`\n${'─'.repeat(60)}\nSample (first 3 rows):\n${'─'.repeat(60)}`)
for (const p of parsed.slice(0, 3)) {
  const dr = designResolution.get(p.designName)
  const cats = p.categoriesPersian.map((c) => CATEGORY_MAP[c]?.name).filter(Boolean)
  console.log(`\n[${p.sku}] ${p.name}`)
  console.log(`   slug:           ${p.slug}`)
  console.log(`   design:         ${p.designName} → ${dr?.mode === 'existing' ? `id=${dr.id}` : 'CREATE'}`)
  console.log(`   piece_type:     ${p.pieceType ?? '(null — review)'} (from "${p.pieceLabel}")`)
  console.log(`   categories:     ${cats.join(' · ') || '(none)'}`)
  console.log(`   basePriceRials: ${p.basePriceRials.toLocaleString()}`)
  console.log(`   salePriceRials: ${p.salePriceRials?.toLocaleString() ?? '—'}`)
  console.log(`   availability:   ${p.availability}`)
  console.log(`   action:         ${productBySku.has(p.sku) ? `UPDATE (id=${productBySku.get(p.sku)?.id})` : 'CREATE'}`)
}

if (DRY) {
  console.log(`\n${'═'.repeat(60)}\n🔍 DRY RUN complete. No DB writes performed.`)
  console.log(`Re-run with --apply to perform the import.`)
  console.log(`${'═'.repeat(60)}\n`)
  await client.end()
  process.exit(0)
}

// ───────────────────────── Apply phase ─────────────────────────

console.log(`\n${'═'.repeat(60)}\n✍️  Applying changes...\n${'═'.repeat(60)}`)

await client.query('BEGIN')
try {
  // Create missing designs
  for (const name of designsToCreate) {
    const slug = slugify(name) || `design-${Date.now()}`
    const r = await client.query<{ id: number }>(
      `INSERT INTO designs (name, slug, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
      [name, slug],
    )
    designResolution.set(name, { id: r.rows[0]!.id, mode: 'existing' })
    console.log(`  ✓ design created: ${name} (id=${r.rows[0]!.id})`)
  }

  // Create missing categories
  for (const [xlsxToken, target] of categoryResolution.entries()) {
    if (target.mode !== 'create') continue
    const def = CATEGORY_MAP[xlsxToken]
    const r = await client.query<{ id: number }>(
      `INSERT INTO categories (name, slug, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
      [def.name, def.slug],
    )
    categoryResolution.set(xlsxToken, { id: r.rows[0]!.id, mode: 'existing' })
    console.log(`  ✓ category created: ${def.name} (id=${r.rows[0]!.id})`)
  }

  // Upsert products
  let created = 0
  let updated = 0
  let errors = 0
  for (const p of parsed) {
    try {
      const designId = designResolution.get(p.designName)?.id
      if (designId == null) throw new Error(`unresolved design: ${p.designName}`)
      const catIds = p.categoriesPersian
        .map((t) => categoryResolution.get(t)?.id)
        .filter((id): id is number => id != null)

      const existing = productBySku.get(p.sku)
      let productId: number
      if (existing) {
        await client.query(
          `UPDATE products SET
            name = $1, slug = $2, design_id = $3, piece_type = $4,
            base_price_rials = $5, sale_price_rials = $6, availability = $7,
            lead_time_days = $8, status = $9, inquiry_enabled = $10, updated_at = NOW()
          WHERE id = $11`,
          [
            p.name, p.slug, designId, p.pieceType,
            p.basePriceRials, p.salePriceRials, p.availability,
            DEFAULT_LEAD_TIME_DAYS, 'published', true,
            existing.id,
          ],
        )
        productId = existing.id
        updated++
      } else {
        const r = await client.query<{ id: number }>(
          `INSERT INTO products (
            name, slug, design_id, piece_type, sku,
            base_price_rials, sale_price_rials, availability,
            lead_time_days, status, inquiry_enabled,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id`,
          [
            p.name, p.slug, designId, p.pieceType, p.sku,
            p.basePriceRials, p.salePriceRials, p.availability,
            DEFAULT_LEAD_TIME_DAYS, 'published', true,
          ],
        )
        productId = r.rows[0]!.id
        productBySku.set(p.sku, { id: productId, sku: p.sku })
        created++
      }

      // Sync categoryIds rels: delete old, insert new
      await client.query(
        `DELETE FROM products_rels WHERE parent_id = $1 AND path = 'categoryIds'`,
        [productId],
      )
      for (let i = 0; i < catIds.length; i++) {
        await client.query(
          `INSERT INTO products_rels ("order", parent_id, path, categories_id) VALUES ($1, $2, 'categoryIds', $3)`,
          [i + 1, productId, catIds[i]],
        )
      }

      if ((created + updated) % 25 === 0) {
        console.log(`  … created ${created}, updated ${updated}, errors ${errors}`)
      }
    } catch (e: any) {
      errors++
      console.error(`  ✗ ${p.sku} "${p.name}": ${e.message || e}`)
    }
  }

  await client.query('COMMIT')

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`✓ Done. ${created} created, ${updated} updated, ${errors} errors.`)
  console.log(`${'═'.repeat(60)}\n`)
  await client.end()
  process.exit(errors > 0 ? 1 : 0)
} catch (e: any) {
  await client.query('ROLLBACK')
  console.error(`\n✗ Transaction aborted: ${e.message || e}\n`)
  await client.end()
  process.exit(1)
}
