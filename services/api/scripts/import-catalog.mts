/**
 * Zhic catalog importer — replaces the demo data with the real catalog
 * from /home/ahmad/imports/ZhicProducts_webp/.
 *
 * Runs in phases so each one can be reviewed/checkpointed independently:
 *
 *   --inventory   Dry-run. Scan xlsx + filesystem + DB. Write a JSON report
 *                 to /tmp/catalog-inventory.json. No writes.
 *   --wipe        DESTRUCTIVE. Delete demo Products, ProductVariants, Designs,
 *                 Categories, and product-referenced Media. Keeps Design /
 *                 Showroom / Home / Journal media untouched (the "bedroom-set
 *                 page medias" the operator wants preserved).
 *   --categories  Seed 38 Categories per the canonical tree from final.xlsx.
 *   --designs     Seed 26 Designs with occupancies + visible flag (D1).
 *   --media       Upload the 584 .webp files to Payload Media (creates DB
 *                 records + uploads to Abr Arvan S3 via the storage adapter).
 *   --products    Seed 374 Products + ProductVariants. Links media via the
 *                 filename → product slug heuristic.
 *
 * Always pair with --apply to actually write; default is dry-run for every
 * destructive phase.
 *
 *   pnpm --filter @zhic/api tsx scripts/import-catalog.mts --inventory
 *   pnpm --filter @zhic/api tsx scripts/import-catalog.mts --wipe --apply
 *
 * Why direct pg + REST instead of Payload local API:
 *   Same Node-24/Payload-boot bug that hit the legacy import-products.mts.
 *   We use pg for reads/writes and Payload's REST `/api/media` POST for
 *   media uploads (which DOES boot correctly under pm2 since zhic-api is
 *   already running).
 */

import pg from 'pg'
import xlsx from 'xlsx'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))

// ───────────────────────── Constants ─────────────────────────

const IMPORTS_ROOT = '/home/ahmad/imports'
const ZHIC_PRODUCTS_DIR = path.join(IMPORTS_ROOT, 'ZhicProducts_webp')
const CATEGORIES_XLSX = path.join(IMPORTS_ROOT, 'final.xlsx')
const PRODUCTS_XLSX = path.join(ZHIC_PRODUCTS_DIR, 'final-organized.xlsx')
const REPORT_PATH = '/tmp/catalog-inventory.json'

// Lifestyle subfolders inside each series (per filesystem audit).
// Files inside these subfolders are "in-room" / contextual product shots,
// NOT lifestyle photos in the sense of stock photography. We still link
// them to products via the same filename heuristic — the subfolder is
// just a media tag for "room scene" vs "cutout".
const LIFESTYLE_SUBFOLDERS = new Set(['room', 'kid', 'teen', 'couple'])

// "chairs" is a catch-all folder for study/vanity chairs from multiple
// series — files inside are still named `<series>-<chair-type>-*.webp`.
const CATCH_ALL_FOLDERS = new Set(['chairs'])

// Series with no photo folder — operator decision D1=(c): seed as
// visible:false so they're hidden from the frontend until photos arrive.
const SERIES_WITHOUT_PHOTOS = new Set([
  'adrian', 'catherine', 'classic', 'eliza', 'nikan', 'romantic', 'roco',
])

// ───────────────────────── Types ─────────────────────────

type XlsxProductRow = {
  series: string | null
  type: string | null
  attributes: string | null
  url: string | null
  slug: string | null
  media_files: string | null
  media_count: number | null
  price_rial: number | null
  price_toman: number | null
  visible: 'yes' | 'no' | null
  price_match_note: string | null
}

type XlsxCategoryRow = {
  categories_url: string | null
  product_types: string | null
  farsi_name: string | null
}

type FsFile = {
  /** absolute path */
  absPath: string
  /** relative path from ZhicProducts_webp/ */
  relPath: string
  /** top-level folder (series name, or 'chairs') */
  folder: string
  /** subfolder if present (e.g. 'room', 'kid'), else null */
  subfolder: string | null
  /** just the filename */
  filename: string
}

type DbCounts = {
  products: number
  productVariants: number
  designs: number
  categories: number
  media: number
}

type DbMediaRef = {
  id: number
  filename: string
  /** which collections reference this media. Empty = orphan. */
  refs: Array<{ collection: string; recordId: number; field: string }>
}

// ───────────────────────── Args ─────────────────────────

const { values: args } = parseArgs({
  options: {
    inventory: { type: 'boolean', default: false },
    wipe: { type: 'boolean', default: false },
    categories: { type: 'boolean', default: false },
    designs: { type: 'boolean', default: false },
    media: { type: 'boolean', default: false },
    products: { type: 'boolean', default: false },
    apply: { type: 'boolean', default: false },
  },
})

const PHASE = args.inventory
  ? 'inventory'
  : args.wipe
    ? 'wipe'
    : args.categories
      ? 'categories'
      : args.designs
        ? 'designs'
        : args.media
          ? 'media'
          : args.products
            ? 'products'
            : null

if (!PHASE) {
  console.error('Usage: tsx scripts/import-catalog.mts --<phase> [--apply]')
  console.error('Phases: --inventory --wipe --categories --designs --media --products')
  process.exit(1)
}

const APPLY = args.apply

// ───────────────────────── DB connection ─────────────────────────

function readDatabaseUri(): string {
  const envPath = path.resolve(SCRIPT_DIR, '..', '.env')
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^DATABASE_URI=(.+)$/)
    if (m) return m[1]!.trim().replace(/^["']|["']$/g, '')
  }
  throw new Error(`DATABASE_URI not found in ${envPath}`)
}

// ───────────────────────── Helpers ─────────────────────────

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Take the part of a folder name before the first finish suffix.
 *  e.g. "elizabeth-cream" → "elizabeth", "parla-2staged" → "parla". */
function seriesFromFolder(folder: string): string {
  if (CATCH_ALL_FOLDERS.has(folder)) return folder
  // Known finish suffixes: -cream, -gray, -green, -2staged
  return folder.replace(/-(cream|gray|green|2staged)$/, '')
}

/** Derive the finish axis from a folder name + filename.
 *  Heuristic per D4:
 *   1. filename contains "-cream-" or ends "-cream.webp" → cream
 *   2. else "-gray-" → gray, "-green-" → green
 *   3. else folder "parla-2staged" → two-stage
 *   4. else folder suffix → derived finish
 *   5. else null (no finish split for this series)
 */
function finishFromMedia(folder: string, filename: string): string | null {
  const base = filename.toLowerCase()
  if (/(^|-)cream(-|\.|$)/.test(base)) return 'cream'
  if (/(^|-)gray(-|\.|$)/.test(base)) return 'gray'
  if (/(^|-)green(-|\.|$)/.test(base)) return 'green'
  if (folder === 'parla-2staged') return 'two-stage'
  const folderSuffix = folder.match(/-(cream|gray|green)$/)?.[1]
  if (folderSuffix) return folderSuffix
  return null
}

// ───────────────────────── Filesystem scan ─────────────────────────

function scanFs(): FsFile[] {
  const out: FsFile[] = []
  const entries = fs.readdirSync(ZHIC_PRODUCTS_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const folder = entry.name
    if (folder.startsWith('_')) continue // _archive etc.
    const folderPath = path.join(ZHIC_PRODUCTS_DIR, folder)
    // Top-level files
    for (const f of fs.readdirSync(folderPath, { withFileTypes: true })) {
      if (f.isFile() && f.name.endsWith('.webp')) {
        out.push({
          absPath: path.join(folderPath, f.name),
          relPath: `${folder}/${f.name}`,
          folder,
          subfolder: null,
          filename: f.name,
        })
      } else if (f.isDirectory()) {
        // Sub-subfolder (lifestyle scenes — room/kid/teen/couple)
        const subPath = path.join(folderPath, f.name)
        for (const sf of fs.readdirSync(subPath, { withFileTypes: true })) {
          if (sf.isFile() && sf.name.endsWith('.webp')) {
            out.push({
              absPath: path.join(subPath, sf.name),
              relPath: `${folder}/${f.name}/${sf.name}`,
              folder,
              subfolder: f.name,
              filename: sf.name,
            })
          }
        }
      }
    }
  }
  return out
}

// ───────────────────────── Xlsx parsing ─────────────────────────

function readProductsXlsx() {
  const wb = xlsx.readFile(PRODUCTS_XLSX)
  const products = xlsx.utils.sheet_to_json<XlsxProductRow>(wb.Sheets['products']!, {
    defval: null,
    raw: true,
  })
  const pricesUnmatched = xlsx.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets['prices_unmatched']!,
    { defval: null, raw: true },
  )
  const navigation = xlsx.utils.sheet_to_json<XlsxCategoryRow>(wb.Sheets['navigation']!, {
    defval: null,
    raw: true,
  })
  const mediaExtras = xlsx.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets['media_extras']!,
    { defval: null, raw: true },
  )
  return { products, pricesUnmatched, navigation, mediaExtras }
}

function readCategoriesXlsx() {
  const wb = xlsx.readFile(CATEGORIES_XLSX)
  const sheet = wb.Sheets[wb.SheetNames[0]!]!
  // The categories table lives in cols F-H of Sheet1 (per the operator's earlier audit).
  // We read the whole sheet and pick cols F/G/H.
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: ['products_url', 'series', 'product_type', 'attributes', '_gap', 'categories_url', 'product_types', 'farsi_name'],
    range: 1, // skip header row
    defval: null,
    raw: true,
  })
  return rows
    .map((r) => ({
      categories_url: typeof r.categories_url === 'string' ? r.categories_url : null,
      product_types: typeof r.product_types === 'string' ? r.product_types : null,
      farsi_name: typeof r.farsi_name === 'string' ? r.farsi_name : null,
    }))
    .filter((r) => r.categories_url != null)
}

// ───────────────────────── DB queries ─────────────────────────

async function queryDb(client: pg.Client) {
  const counts = await client.query<DbCounts & { c: string }>(`
    SELECT 'products' as c, count(*)::int as products,
           0 as product_variants, 0 as designs, 0 as categories, 0 as media FROM products
    UNION ALL SELECT 'product_variants', 0, count(*)::int, 0, 0, 0 FROM product_variants
    UNION ALL SELECT 'designs', 0, 0, count(*)::int, 0, 0 FROM designs
    UNION ALL SELECT 'categories', 0, 0, 0, count(*)::int, 0 FROM categories
    UNION ALL SELECT 'media', 0, 0, 0, 0, count(*)::int FROM media
  `)
  const c: DbCounts = { products: 0, productVariants: 0, designs: 0, categories: 0, media: 0 }
  for (const row of counts.rows) {
    if (row.c === 'products') c.products = row.products
    if (row.c === 'product_variants') c.productVariants = row.product_variants
    if (row.c === 'designs') c.designs = row.designs
    if (row.c === 'categories') c.categories = row.categories
    if (row.c === 'media') c.media = row.media
  }

  // Categories: list with parent
  const cats = await client.query<{
    id: number
    name: string
    slug: string
    parent_id: number | null
  }>(`SELECT id, name, slug, parent_id FROM categories ORDER BY id`)

  // Designs: list with media refs
  const designs = await client.query<{
    id: number
    name: string
    slug: string
    hero_media_id: number | null
    slider_media_id: number | null
  }>(`SELECT id, name, slug, hero_media_id, slider_media_id FROM designs ORDER BY id`)

  // Products: list with design + piece_type
  const products = await client.query<{
    id: number
    name: string
    slug: string
    design_id: number | null
    piece_type: string | null
  }>(`SELECT id, name, slug, design_id, piece_type FROM products ORDER BY id`)

  // Media references — anything that points to a media row.
  // We check the standard FK columns plus the relations table.
  const mediaRefs = new Map<number, DbMediaRef>()
  const allMedia = await client.query<{ id: number; filename: string }>(
    `SELECT id, filename FROM media ORDER BY id`,
  )
  for (const m of allMedia.rows) {
    mediaRefs.set(m.id, { id: m.id, filename: m.filename, refs: [] })
  }

  // Designs: hero_media_id + slider_media_id (already fetched)
  for (const d of designs.rows) {
    if (d.hero_media_id) {
      mediaRefs.get(d.hero_media_id)?.refs.push({ collection: 'designs', recordId: d.id, field: 'heroMedia' })
    }
    if (d.slider_media_id) {
      mediaRefs.get(d.slider_media_id)?.refs.push({ collection: 'designs', recordId: d.id, field: 'sliderMedia' })
    }
  }

  // Categories: cover_id
  const catCovers = await client.query<{ id: number; cover_id: number | null }>(
    `SELECT id, cover_id FROM categories WHERE cover_id IS NOT NULL`,
  )
  for (const r of catCovers.rows) {
    if (r.cover_id) {
      mediaRefs.get(r.cover_id)?.refs.push({ collection: 'categories', recordId: r.id, field: 'cover' })
    }
  }

  // ProductVariants: image_id
  const variantImages = await client.query<{ id: number; image_id: number | null }>(
    `SELECT id, image_id FROM product_variants WHERE image_id IS NOT NULL`,
  )
  for (const r of variantImages.rows) {
    if (r.image_id) {
      mediaRefs.get(r.image_id)?.refs.push({ collection: 'product-variants', recordId: r.id, field: 'image' })
    }
  }

  // gallery / multi-media refs go through payload_locked_documents_rels?
  // For now we look at the per-collection _rels tables for "gallery" / "moodboard" paths.
  // designs_rels handles design.gallery / design.moodboard
  const designsRels = await client.query<{ parent_id: number; path: string; media_id: number | null }>(
    `SELECT parent_id, path, media_id FROM designs_rels WHERE media_id IS NOT NULL`,
  )
  for (const r of designsRels.rows) {
    if (r.media_id) {
      mediaRefs.get(r.media_id)?.refs.push({ collection: 'designs', recordId: r.parent_id, field: r.path })
    }
  }
  const productsRels = await client.query<{ parent_id: number; path: string; media_id: number | null }>(
    `SELECT parent_id, path, media_id FROM products_rels WHERE media_id IS NOT NULL`,
  )
  for (const r of productsRels.rows) {
    if (r.media_id) {
      mediaRefs.get(r.media_id)?.refs.push({ collection: 'products', recordId: r.parent_id, field: r.path })
    }
  }
  // Showrooms / journal / home etc. — same pattern. We only care about Products vs everything-else
  // so any non-products ref is a "keep". The full survey:
  for (const rels of ['articles_rels', 'showrooms_rels', 'home_rels', 'collections_rels', 'materials_rels']) {
    try {
      const r = await client.query<{ parent_id: number; path: string; media_id: number | null }>(
        `SELECT parent_id, path, media_id FROM ${rels} WHERE media_id IS NOT NULL`,
      )
      const collName = rels.replace(/_rels$/, '')
      for (const row of r.rows) {
        if (row.media_id) {
          mediaRefs.get(row.media_id)?.refs.push({
            collection: collName,
            recordId: row.parent_id,
            field: row.path,
          })
        }
      }
    } catch {
      // table may not exist (e.g., if a collection wasn't migrated yet); skip silently.
    }
  }
  // home_hero_slides has its own table for the heroSlides[] array field on the home global
  try {
    const r = await client.query<{ media_id: number | null }>(
      `SELECT media_id FROM home_hero_slides WHERE media_id IS NOT NULL`,
    )
    for (const row of r.rows) {
      if (row.media_id) {
        mediaRefs.get(row.media_id)?.refs.push({
          collection: 'home',
          recordId: 0,
          field: 'heroSlides',
        })
      }
    }
  } catch {}

  return {
    counts: c,
    categories: cats.rows,
    designs: designs.rows,
    products: products.rows,
    media: mediaRefs,
  }
}

// ───────────────────────── INVENTORY PHASE ─────────────────────────

async function runInventory(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`🔍 INVENTORY — Phase 6.1 dry-run`)
  console.log(`${'═'.repeat(70)}\n`)

  // ── 1. Filesystem scan
  console.log(`Scanning ${ZHIC_PRODUCTS_DIR} ...`)
  const fsFiles = scanFs()
  const byFolder: Record<string, number> = {}
  const bySubfolder: Record<string, number> = {}
  for (const f of fsFiles) {
    byFolder[f.folder] = (byFolder[f.folder] ?? 0) + 1
    if (f.subfolder) {
      const key = `${f.folder}/${f.subfolder}`
      bySubfolder[key] = (bySubfolder[key] ?? 0) + 1
    }
  }
  console.log(`  Found ${fsFiles.length} .webp files in ${Object.keys(byFolder).length} folders.`)

  // ── 2. Xlsx parsing
  console.log(`\nReading xlsx ...`)
  const { products: xlsxProducts, pricesUnmatched, navigation, mediaExtras } = readProductsXlsx()
  const categoryTree = readCategoriesXlsx()
  console.log(`  Products sheet: ${xlsxProducts.length} rows`)
  console.log(`  Prices-unmatched: ${pricesUnmatched.length} rows`)
  console.log(`  Navigation (categories tree): ${categoryTree.length} entries`)
  console.log(`  Media extras: ${mediaExtras.length} rows`)

  // Unique series
  const xlsxSeriesCounts = new Map<string, number>()
  for (const p of xlsxProducts) {
    if (!p.series) continue
    xlsxSeriesCounts.set(p.series, (xlsxSeriesCounts.get(p.series) ?? 0) + 1)
  }
  console.log(`  Distinct series in products sheet: ${xlsxSeriesCounts.size}`)

  // Unique piece-types
  const xlsxTypeCounts = new Map<string, number>()
  for (const p of xlsxProducts) {
    if (!p.type) continue
    xlsxTypeCounts.set(p.type, (xlsxTypeCounts.get(p.type) ?? 0) + 1)
  }
  console.log(`  Distinct piece-types: ${xlsxTypeCounts.size}`)

  // ── 3. DB query
  console.log(`\nQuerying DB ...`)
  const dbState = await queryDb(client)
  console.log(`  Existing: ${dbState.counts.products} products · ${dbState.counts.productVariants} variants · ${dbState.counts.designs} designs · ${dbState.counts.categories} categories · ${dbState.counts.media} media`)

  // ── 4. Cross-reference series ↔ folders
  const folderSeries = new Set<string>()
  for (const f of fsFiles) folderSeries.add(seriesFromFolder(f.folder))
  const xlsxSeriesSet = new Set(xlsxSeriesCounts.keys())
  const seriesInXlsxNoFolder = [...xlsxSeriesSet].filter(
    (s) => s !== '-' && !folderSeries.has(s) && !SERIES_WITHOUT_PHOTOS.has(s),
  )
  const foldersWithoutXlsx = [...folderSeries].filter((s) => !xlsxSeriesSet.has(s) && !CATCH_ALL_FOLDERS.has(s))

  // ── 5. Media to-wipe vs to-keep
  const mediaToWipe: number[] = []
  const mediaToKeep: number[] = []
  const mediaOrphan: number[] = []
  for (const [id, ref] of dbState.media.entries()) {
    if (ref.refs.length === 0) {
      mediaOrphan.push(id)
      continue
    }
    const onlyProductRefs = ref.refs.every(
      (r) => r.collection === 'products' || r.collection === 'product-variants',
    )
    if (onlyProductRefs) mediaToWipe.push(id)
    else mediaToKeep.push(id)
  }

  // ── 6. Build report
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'inventory',
    filesystem: {
      totalFiles: fsFiles.length,
      folderCount: Object.keys(byFolder).length,
      byFolder,
      bySubfolder,
      uniqueSeries: [...folderSeries].sort(),
      catchAllFolders: [...folderSeries].filter((s) => CATCH_ALL_FOLDERS.has(s)),
    },
    xlsx: {
      productsCount: xlsxProducts.length,
      pricesUnmatchedCount: pricesUnmatched.length,
      navigationCount: categoryTree.length,
      mediaExtrasCount: mediaExtras.length,
      seriesCounts: Object.fromEntries(xlsxSeriesCounts),
      pieceTypeCounts: Object.fromEntries(xlsxTypeCounts),
    },
    db: {
      counts: dbState.counts,
      categories: dbState.categories.map((c) => ({ id: c.id, slug: c.slug, parent_id: c.parent_id })),
      designs: dbState.designs.map((d) => ({ id: d.id, slug: d.slug })),
      products: dbState.products.map((p) => ({ id: p.id, slug: p.slug, piece_type: p.piece_type })),
    },
    crossRef: {
      seriesInXlsxNoFolder, // expected per D1 = (c): adrian, catherine, classic, eliza, nikan, romantic, roco
      foldersWithoutXlsx, // unexpected — investigate
    },
    media: {
      totalDbMedia: dbState.media.size,
      toWipeCount: mediaToWipe.length,
      toKeepCount: mediaToKeep.length,
      orphanCount: mediaOrphan.length,
      toWipeIds: mediaToWipe,
      toKeepIds: mediaToKeep,
      orphanIds: mediaOrphan,
    },
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  // ── 7. Print summary
  console.log(`\n${'─'.repeat(70)}`)
  console.log(`📋 Inventory summary`)
  console.log(`${'─'.repeat(70)}`)
  console.log(`\nFilesystem:`)
  console.log(`  ${fsFiles.length} .webp files across ${Object.keys(byFolder).length} folders`)
  console.log(`  Series-folder map: ${[...folderSeries].sort().join(', ')}`)
  console.log(`  Lifestyle subfolders: ${Object.keys(bySubfolder).sort().join(', ')}`)

  console.log(`\nXlsx vs Filesystem:`)
  if (seriesInXlsxNoFolder.length > 0) {
    console.log(`  Series in xlsx with NO photo folder (per D1 = visible:false): ${seriesInXlsxNoFolder.join(', ')}`)
  } else {
    console.log(`  Every xlsx series has a photo folder. (No D1 misses.)`)
  }
  if (foldersWithoutXlsx.length > 0) {
    console.log(`  ⚠️  Folders with NO xlsx products: ${foldersWithoutXlsx.join(', ')}  ← investigate`)
  }

  console.log(`\nDB state (current):`)
  console.log(`  ${dbState.counts.products} products · ${dbState.counts.productVariants} variants · ${dbState.counts.designs} designs · ${dbState.counts.categories} categories`)
  console.log(`  ${dbState.counts.media} media total`)
  console.log(`    → ${mediaToWipe.length} referenced ONLY by products/variants → WIPE candidates`)
  console.log(`    → ${mediaToKeep.length} referenced by designs/showrooms/home/etc. → KEEP`)
  console.log(`    → ${mediaOrphan.length} orphan (no refs) → safe to delete but not required`)

  console.log(`\nWhat the import will do (when --apply is set on later phases):`)
  console.log(`  Wipe:    ${dbState.counts.products} products, ${dbState.counts.productVariants} variants, ${dbState.counts.designs} designs, ${dbState.counts.categories} categories, ${mediaToWipe.length} product-only media`)
  console.log(`  Create:  ~38 categories (canonical tree), ${xlsxSeriesCounts.size} designs, ${xlsxProducts.length} products, ~880 variants`)
  console.log(`  Upload:  ${fsFiles.length} .webp files to Payload Media + Abr Arvan S3`)
  console.log(`  Keep:    ${mediaToKeep.length} media referenced by non-product collections`)

  console.log(`\n📄 Full report written to: ${REPORT_PATH}`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── WIPE PHASE ─────────────────────────

/**
 * Re-derive the media wipe targets at wipe time (DB may have shifted since
 * inventory ran). "Product-only refs" = media whose ONLY refs are to
 * products/products_rels/product_variants. Per operator decision:
 *   - Delete demo products / variants / designs / categories (full wipe).
 *   - Delete ONLY product-referenced media. Do NOT touch orphans or media
 *     referenced from designs/showrooms/home/journal/etc.
 */
async function getMediaWipeIds(client: pg.Client): Promise<number[]> {
  const all = await client.query<{ id: number }>('SELECT id FROM media')
  if (all.rows.length === 0) return []

  const refsPerMedia = new Map<number, Set<string>>()
  for (const r of all.rows) refsPerMedia.set(r.id, new Set())

  // Walk all known media-referencing places. Each tag tells us which
  // collection refs that media. "Product-only" if every tag is products|
  // product-variants.
  type Ref = { mediaCol: string; refTag: string; sql: string }
  const checks: Ref[] = [
    { mediaCol: 'hero_media_id', refTag: 'designs', sql: 'SELECT hero_media_id AS media_id FROM designs WHERE hero_media_id IS NOT NULL' },
    { mediaCol: 'slider_media_id', refTag: 'designs', sql: 'SELECT slider_media_id AS media_id FROM designs WHERE slider_media_id IS NOT NULL' },
    { mediaCol: 'cover_id', refTag: 'categories', sql: 'SELECT cover_id AS media_id FROM categories WHERE cover_id IS NOT NULL' },
    { mediaCol: 'image_id', refTag: 'product-variants', sql: 'SELECT image_id AS media_id FROM product_variants WHERE image_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'designs', sql: 'SELECT media_id FROM designs_rels WHERE media_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'products', sql: 'SELECT media_id FROM products_rels WHERE media_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'articles', sql: 'SELECT media_id FROM articles_rels WHERE media_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'showrooms', sql: 'SELECT media_id FROM showrooms_rels WHERE media_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'home', sql: 'SELECT media_id FROM home_rels WHERE media_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'collections', sql: 'SELECT media_id FROM collections_rels WHERE media_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'materials', sql: 'SELECT media_id FROM materials_rels WHERE media_id IS NOT NULL' },
    { mediaCol: 'media_id', refTag: 'home', sql: 'SELECT media_id FROM home_hero_slides WHERE media_id IS NOT NULL' },
  ]
  for (const c of checks) {
    try {
      const r = await client.query<{ media_id: number }>(c.sql)
      for (const row of r.rows) refsPerMedia.get(row.media_id)?.add(c.refTag)
    } catch {
      // table may not exist on this DB; skip silently
    }
  }

  // "Wipe" = at least one product/variant ref AND no non-product refs.
  // Orphans (empty refs) stay (operator instruction).
  const wipeIds: number[] = []
  for (const [id, refs] of refsPerMedia.entries()) {
    if (refs.size === 0) continue // orphan → keep
    const hasNonProduct = [...refs].some(
      (r) => r !== 'products' && r !== 'product-variants',
    )
    if (!hasNonProduct) wipeIds.push(id)
  }
  return wipeIds
}

async function runWipe(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`💣 WIPE — Phase 6.2 ${APPLY ? '✍️  APPLY MODE (destructive)' : '🔍 DRY-RUN (no writes)'}`)
  console.log(`${'═'.repeat(70)}\n`)

  // Snapshot counts before
  const before = await client.query<{ c: string; n: number }>(`
    SELECT 'products' AS c, count(*)::int AS n FROM products
    UNION ALL SELECT 'product_variants', count(*)::int FROM product_variants
    UNION ALL SELECT 'designs', count(*)::int FROM designs
    UNION ALL SELECT 'categories', count(*)::int FROM categories
    UNION ALL SELECT 'media', count(*)::int FROM media
  `)
  console.log(`Before:`)
  for (const r of before.rows) console.log(`  ${r.c.padEnd(20)} ${r.n}`)

  const mediaWipeIds = await getMediaWipeIds(client)
  console.log(`\nProduct-only-referenced media IDs to wipe: ${mediaWipeIds.length}`)
  if (mediaWipeIds.length > 0 && mediaWipeIds.length <= 30) {
    console.log(`  ${mediaWipeIds.join(', ')}`)
  }

  if (!APPLY) {
    console.log(`\n🔍 DRY-RUN. Pass --apply to execute. No writes performed.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`💥 EXECUTING WIPE IN TRANSACTION`)
  console.log(`${'─'.repeat(70)}`)

  await client.query('BEGIN')
  try {
    // CASCADE deletes propagate through *_rels and child tables (allowed_axes,
    // occupancies, variants_axes, payload_locked_documents_rels). We hit the
    // parent tables in order; PG resolves FKs at statement boundary.

    // 1. ProductVariants first (depends on products via FK CASCADE, but cleaner
    //    to drop them explicitly since the table also has product_variants_axes
    //    child rows).
    const variants = await client.query(`DELETE FROM product_variants RETURNING id`)
    console.log(`  ✓ Deleted ${variants.rowCount} product_variants (+ axes via CASCADE)`)

    // 2. Products. CASCADE deletes products_rels (gallery refs + categoryIds rels).
    const products = await client.query(`DELETE FROM products RETURNING id`)
    console.log(`  ✓ Deleted ${products.rowCount} products (+ rels via CASCADE)`)

    // 3. Designs. CASCADE deletes designs_rels (gallery + storyBlocks media)
    //    + designs_occupancies (Phase 1 child table).
    const designs = await client.query(`DELETE FROM designs RETURNING id`)
    console.log(`  ✓ Deleted ${designs.rowCount} designs (+ rels + occupancies via CASCADE)`)

    // 4. Categories. Self-referential parent FK uses SET NULL by default in
    //    Payload; deleting in any order works. CASCADE on categories_allowed_axes.
    const categories = await client.query(`DELETE FROM categories RETURNING id`)
    console.log(`  ✓ Deleted ${categories.rowCount} categories (+ allowed_axes via CASCADE)`)

    // 5. Product-only-referenced media. Use the IDs captured BEFORE the
    //    product/variant deletes — after those CASCADEs, the refs are gone
    //    and the media looks like a plain orphan, which we don't touch.
    if (mediaWipeIds.length > 0) {
      const r = await client.query(
        `DELETE FROM media WHERE id = ANY($1::int[]) RETURNING id`,
        [mediaWipeIds],
      )
      console.log(`  ✓ Deleted ${r.rowCount} product-only-referenced media records`)
    } else {
      console.log(`  ✓ No product-only-referenced media to wipe`)
    }

    await client.query('COMMIT')
  } catch (e: any) {
    await client.query('ROLLBACK')
    console.error(`\n✗ Transaction aborted: ${e.message || e}\n`)
    throw e
  }

  // Snapshot counts after
  const after = await client.query<{ c: string; n: number }>(`
    SELECT 'products' AS c, count(*)::int AS n FROM products
    UNION ALL SELECT 'product_variants', count(*)::int FROM product_variants
    UNION ALL SELECT 'designs', count(*)::int FROM designs
    UNION ALL SELECT 'categories', count(*)::int FROM categories
    UNION ALL SELECT 'media', count(*)::int FROM media
  `)
  console.log(`\nAfter:`)
  for (const r of after.rows) console.log(`  ${r.c.padEnd(20)} ${r.n}`)

  console.log(`\n${'═'.repeat(70)}`)
  console.log(`✓ Wipe complete. DB ready for fresh import in Phase 6.3+.`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── Main ─────────────────────────

const dbUri = readDatabaseUri()
const client = new pg.Client({ connectionString: dbUri })
await client.connect()

try {
  if (PHASE === 'inventory') {
    await runInventory(client)
  } else if (PHASE === 'wipe') {
    await runWipe(client)
  } else {
    console.error(`\n❌ Phase "${PHASE}" not yet implemented. Available: --inventory --wipe.`)
    console.error(`   Other phases land incrementally in 6.3 … 6.7.`)
    process.exit(1)
  }
} finally {
  await client.end()
}

process.exit(0)
