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
import sharp from 'sharp'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const MEDIA_DIR = path.resolve(SCRIPT_DIR, '..', 'media')
const MEDIA_MAP_PATH = '/tmp/media-map.json'

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
    variants: { type: 'boolean', default: false },
    'persian-names': { type: 'boolean', default: false },
    'bedroom-set-media': { type: 'boolean', default: false },
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
            : args.variants
              ? 'variants'
              : args['persian-names']
                ? 'persian-names'
                : args['bedroom-set-media']
                  ? 'bedroom-set-media'
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

// ───────────────────────── CATEGORIES PHASE ─────────────────────────

/** Hardcoded axis_filter for the 5 SEO-promoted facet sub-leaves
 *  (per [[zhic-products-overhaul]] locked decision). */
const FACET_AXIS_FILTERS: Record<string, { axis: string; value: string }> = {
  'bed/baby/convertible': { axis: 'conversion', value: 'convertible' },
  'storage/wardrobe/single-door': { axis: 'doors', value: '1' },
  'storage/wardrobe/double-door': { axis: 'doors', value: '2' },
  'storage/wardrobe/triple-door': { axis: 'doors', value: '3' },
  'storage/wardrobe/sliding': { axis: 'doors', value: 'sliding' },
}

/** Hardcoded allowed_axes defaults per leaf. The operator can refine
 *  via admin once products land — this is a starting point that lets
 *  Phase 6.7 create variants with sensible validation. */
const ALLOWED_AXES_DEFAULTS: Record<string, string[]> = {
  // beds
  'bed/baby': ['size', 'conversion'],
  'bed/baby/convertible': ['size'],
  'bed/single': ['size', 'footboard'],
  'bed/double': ['size', 'footboard'],
  'bed/bunk': ['bunk_configuration'],
  // table
  'table/vanity': ['width', 'finish', 'drawers'],
  'table/study-desk': ['width', 'finish'],
  // storage
  'storage/bookcase': ['width', 'finish'],
  'storage/file-cabinet': ['drawers', 'finish'],
  'storage/wardrobe': ['doors', 'finish'],
  'storage/wardrobe/single-door': ['finish'],
  'storage/wardrobe/double-door': ['finish'],
  'storage/wardrobe/triple-door': ['finish', 'glass'],
  'storage/wardrobe/sliding': ['finish'],
  // display
  'display/display-cabinet': ['width', 'finish'],
  'display/console': ['drawers', 'finish'],
  // mirror
  'mirror/standing-mirror': ['size', 'finish'],
  'mirror/table-mirror': ['size'],
  'mirror/wall-mirror': ['size'],
  // seating
  'seating/vanity-chair': ['fabric', 'finish'],
  'seating/study-chair': ['fabric', 'finish'],
  'seating/loveseat': ['fabric'],
  // complement
  'complement/bed-box': ['size'],
  'complement/bed-guard': ['size'],
  'complement/bed-jack': ['size'],
  'complement/changing-table': ['finish'],
  'complement/changing-top': ['finish'],
  'complement/wall-shelf': ['width', 'finish'],
  // nightstand
  'nightstand': ['drawers', 'finish'],
}

type CategorySeed = {
  url: string
  segments: string[]
  slug: string
  name: string
  description: string | null
  parentPath: string | null
  depth: number
  axisFilter: { axis: string; value: string } | null
  allowedAxes: string[]
}

function parseCategoriesTree(): CategorySeed[] {
  const rows = readCategoriesXlsx()
  const seeds: CategorySeed[] = []
  for (const row of rows) {
    if (!row.categories_url) continue
    const rawUrl = row.categories_url.trim().replace(/\/$/, '') // drop trailing slash
    // Only /bedroom-furniture/* — skip the /bedroom-set/* rows
    if (!rawUrl.startsWith('/bedroom-furniture')) continue
    // Skip the root /bedroom-furniture itself (the page index, not a Category record)
    if (rawUrl === '/bedroom-furniture') continue

    const inside = rawUrl.replace(/^\/bedroom-furniture\//, '')
    const segments = inside.split('/').filter(Boolean)
    if (segments.length === 0) continue
    const slug = segments[segments.length - 1]!
    const parentPath = segments.length > 1 ? segments.slice(0, -1).join('/') : null
    const persianName = row.farsi_name?.trim() ?? slug

    seeds.push({
      url: rawUrl,
      segments,
      slug,
      name: persianName,
      description: row.product_types?.trim() ?? null,
      parentPath,
      depth: segments.length,
      axisFilter: FACET_AXIS_FILTERS[inside] ?? null,
      allowedAxes: ALLOWED_AXES_DEFAULTS[inside] ?? [],
    })
  }
  // Sort by depth ASC so parents are inserted before children.
  seeds.sort((a, b) => a.depth - b.depth)
  return seeds
}

async function runCategories(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`🌳 CATEGORIES — Phase 6.3 ${APPLY ? '✍️  APPLY MODE' : '🔍 DRY-RUN'}`)
  console.log(`${'═'.repeat(70)}\n`)

  const seeds = parseCategoriesTree()
  console.log(`Parsed ${seeds.length} category nodes from xlsx (sorted by depth):`)
  console.log(
    `  depth-1: ${seeds.filter((s) => s.depth === 1).length} top-level parents`,
  )
  console.log(`  depth-2: ${seeds.filter((s) => s.depth === 2).length} leaves`)
  console.log(`  depth-3: ${seeds.filter((s) => s.depth === 3).length} facet sub-leaves`)
  console.log(`  facet (axis_filter set): ${seeds.filter((s) => s.axisFilter).length}`)
  console.log(`  with allowed_axes:      ${seeds.filter((s) => s.allowedAxes.length > 0).length}`)

  // Check we're starting from a clean slate
  const existing = await client.query<{ id: number; slug: string }>(
    `SELECT id, slug FROM categories`,
  )
  if (existing.rowCount && existing.rowCount > 0) {
    console.log(
      `\n⚠️  ${existing.rowCount} category records already exist. The seed inserts new — slug conflicts will throw.`,
    )
    console.log(`   Existing slugs: ${existing.rows.map((r) => r.slug).join(', ')}`)
  }

  if (!APPLY) {
    console.log(`\n🔍 DRY-RUN — sample of what would be inserted:`)
    for (const s of seeds.slice(0, 8)) {
      console.log(
        `  [${s.depth}] slug=${s.slug.padEnd(20)} parent=${(s.parentPath ?? '(none)').padEnd(20)} name=${s.name}` +
        (s.axisFilter ? ` filter={${s.axisFilter.axis}:${s.axisFilter.value}}` : '') +
        (s.allowedAxes.length ? ` axes=[${s.allowedAxes.join(',')}]` : ''),
      )
    }
    if (seeds.length > 8) console.log(`  ... and ${seeds.length - 8} more`)
    console.log(`\nPass --apply to insert. No writes performed.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`✍️  INSERTING IN TRANSACTION`)
  console.log(`${'─'.repeat(70)}`)

  await client.query('BEGIN')
  try {
    // Track slug → id for parent resolution.
    const slugToId = new Map<string, number>()
    // Also need to resolve by FULL PATH because we have wardrobe (a leaf-parent at storage/wardrobe)
    // AND potentially other ambiguities. Use full-path lookup.
    const pathToId = new Map<string, number>()

    let inserted = 0
    let withAxes = 0
    let withFilter = 0

    for (const s of seeds) {
      const parentId = s.parentPath ? pathToId.get(s.parentPath) ?? null : null

      // Insert the category row
      const axisFilterJson = s.axisFilter ? JSON.stringify(s.axisFilter) : null
      const r = await client.query<{ id: number }>(
        `INSERT INTO categories (
          name, slug, parent_id, axis_filter,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
        RETURNING id`,
        [s.name, s.slug, parentId, axisFilterJson],
      )
      const newId = r.rows[0]!.id
      slugToId.set(s.slug, newId)
      const fullPath = s.segments.join('/')
      pathToId.set(fullPath, newId)

      // Insert allowed_axes child rows if any.
      //
      // Gotcha: Payload v3 reads hasMany-text fields from a UNIFIED
      // `<collection>_texts` table keyed by `path`, NOT from a
      // `<collection>_<fieldname>` table. The migration created
      // `categories_allowed_axes` but Payload's runtime SQL queries
      // `categories_texts WHERE path = 'allowed_axes'`. Writing to the
      // wrong table is silently ignored on read — caught the hard way
      // on 2026-05-23 when the PDP variant picker wouldn't render
      // because every category returned allowed_axes:[] over REST.
      if (s.allowedAxes.length > 0) {
        for (let i = 0; i < s.allowedAxes.length; i++) {
          await client.query(
            `INSERT INTO categories_texts ("order", parent_id, path, text)
             VALUES ($1, $2, 'allowed_axes', $3)`,
            [i, newId, s.allowedAxes[i]],
          )
        }
        withAxes++
      }
      if (s.axisFilter) withFilter++

      inserted++
    }

    await client.query('COMMIT')
    console.log(`  ✓ Inserted ${inserted} categories (${withAxes} with allowed_axes, ${withFilter} facet sub-leaves with axis_filter)`)
  } catch (e: any) {
    await client.query('ROLLBACK')
    console.error(`\n✗ Transaction aborted: ${e.message || e}\n`)
    throw e
  }

  // Verification queries
  const counts = await client.query<{ depth: string; n: number }>(`
    WITH RECURSIVE t AS (
      SELECT id, slug, parent_id, 1 AS depth FROM categories WHERE parent_id IS NULL
      UNION ALL
      SELECT c.id, c.slug, c.parent_id, t.depth + 1 FROM categories c JOIN t ON c.parent_id = t.id
    )
    SELECT depth::text, count(*)::int as n FROM t GROUP BY depth ORDER BY depth
  `)
  console.log(`\nAfter (tree depths):`)
  for (const r of counts.rows) console.log(`  depth ${r.depth}: ${r.n} categories`)

  const facets = await client.query<{ slug: string; axis_filter: unknown }>(
    `SELECT slug, axis_filter FROM categories WHERE axis_filter IS NOT NULL ORDER BY slug`,
  )
  console.log(`\nFacet sub-leaves (axis_filter set):`)
  for (const r of facets.rows) console.log(`  ${r.slug.padEnd(20)} ${JSON.stringify(r.axis_filter)}`)

  console.log(`\n${'═'.repeat(70)}`)
  console.log(`✓ Categories seeded. Phase 6.4 (--designs) lands next.`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── DESIGNS PHASE ─────────────────────────

type DesignSeed = {
  slug: string
  persianName: string
  occupancies: string[]
  hasPhotos: boolean // false for D1 series
}

/** Extract "<series-persian>" from the navigation farsi_name like
 *  "سرویس خواب نوزادی پارلا" → "پارلا". Handles multi-word series like
 *  "بلک اند وایت". */
function extractPersianSeriesName(farsiName: string): string {
  const words = farsiName.trim().split(/\s+/)
  if (words.length >= 4 && words[0] === 'سرویس' && words[1] === 'خواب') {
    return words.slice(3).join(' ')
  }
  return farsiName
}

function parseSeriesFromNav(): DesignSeed[] {
  // The navigation sheet in final-organized.xlsx uses `nav_url`,
  // `description_or_link`, `farsi_name` — NOT the same column names
  // as the categories table in final.xlsx (which uses `categories_url`).
  const wb = xlsx.readFile(PRODUCTS_XLSX)
  const navRows = xlsx.utils.sheet_to_json<{
    nav_url: string | null
    description_or_link: string | null
    farsi_name: string | null
  }>(wb.Sheets['navigation']!, { defval: null, raw: true })

  const occMap = new Map<string, Set<string>>()
  const persianMap = new Map<string, string>()

  for (const row of navRows) {
    const url = row.nav_url
    if (!url || !url.startsWith('/bedroom-set/')) continue
    const parts = url.replace('/bedroom-set/', '').split('/')
    if (parts.length !== 2) continue
    const [occupancy, slug] = parts as [string, string]
    if (!['baby', 'teen', 'double', 'bunk'].includes(occupancy)) continue

    if (!occMap.has(slug)) occMap.set(slug, new Set())
    occMap.get(slug)!.add(occupancy)

    if (!persianMap.has(slug) && row.farsi_name) {
      persianMap.set(slug, extractPersianSeriesName(row.farsi_name))
    }
  }

  const seeds: DesignSeed[] = []
  for (const [slug, occs] of occMap.entries()) {
    seeds.push({
      slug,
      persianName: persianMap.get(slug) ?? slug,
      occupancies: [...occs].sort(),
      hasPhotos: !SERIES_WITHOUT_PHOTOS.has(slug),
    })
  }
  // Sort: D1 hidden series last for clarity in logs
  seeds.sort((a, b) => {
    if (a.hasPhotos !== b.hasPhotos) return a.hasPhotos ? -1 : 1
    return a.slug.localeCompare(b.slug)
  })
  return seeds
}

async function runDesigns(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`🎨 DESIGNS — Phase 6.4 ${APPLY ? '✍️  APPLY MODE' : '🔍 DRY-RUN'}`)
  console.log(`${'═'.repeat(70)}\n`)

  const seeds = parseSeriesFromNav()
  console.log(`Parsed ${seeds.length} series from /bedroom-set/* nav rows:`)
  console.log(`  ${seeds.filter((s) => s.hasPhotos).length} with photos (will seed normally)`)
  console.log(`  ${seeds.filter((s) => !s.hasPhotos).length} without photos (D1 = no media yet, seed anyway)`)

  // Group counts
  const occCounts: Record<string, number> = { baby: 0, teen: 0, double: 0, bunk: 0 }
  for (const s of seeds) for (const o of s.occupancies) occCounts[o]!++
  console.log(`\nOccupancy distribution:`)
  for (const [occ, n] of Object.entries(occCounts)) console.log(`  ${occ.padEnd(8)} ${n} series`)

  // Existing check
  const existing = await client.query<{ slug: string }>(`SELECT slug FROM designs`)
  if (existing.rowCount && existing.rowCount > 0) {
    console.log(
      `\n⚠️  ${existing.rowCount} design records already exist (slugs: ${existing.rows.map((r) => r.slug).join(', ')})`,
    )
  }

  if (!APPLY) {
    console.log(`\n🔍 DRY-RUN — sample of what would be inserted:`)
    for (const s of seeds.slice(0, 8)) {
      console.log(
        `  ${s.slug.padEnd(15)} ${s.persianName.padEnd(20)} occupancies=[${s.occupancies.join(',')}]${s.hasPhotos ? '' : ' (D1)'}`,
      )
    }
    if (seeds.length > 8) console.log(`  ... and ${seeds.length - 8} more`)
    console.log(`\nPass --apply to insert. No writes performed.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`✍️  INSERTING IN TRANSACTION`)
  console.log(`${'─'.repeat(70)}`)

  await client.query('BEGIN')
  try {
    let inserted = 0
    let occRows = 0

    for (const s of seeds) {
      const r = await client.query<{ id: number }>(
        `INSERT INTO designs (name, slug, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        [s.persianName, s.slug],
      )
      const designId = r.rows[0]!.id

      // Insert occupancies child rows
      for (let i = 0; i < s.occupancies.length; i++) {
        await client.query(
          `INSERT INTO designs_occupancies ("order", parent_id, id, value)
           VALUES ($1, $2, $3, $4)`,
          [i, designId, `${designId}-occ-${i}`, s.occupancies[i]],
        )
        occRows++
      }
      inserted++
    }

    await client.query('COMMIT')
    console.log(`  ✓ Inserted ${inserted} designs + ${occRows} designs_occupancies rows`)
  } catch (e: any) {
    await client.query('ROLLBACK')
    console.error(`\n✗ Transaction aborted: ${e.message || e}\n`)
    throw e
  }

  // Verify by sampling
  const verify = await client.query<{ slug: string; name: string; n: number }>(`
    SELECT d.slug, d.name, count(o.value)::int as n
    FROM designs d
    LEFT JOIN designs_occupancies o ON o.parent_id = d.id
    GROUP BY d.id, d.slug, d.name
    ORDER BY d.slug
  `)
  console.log(`\nAll ${verify.rowCount} seeded designs:`)
  for (const r of verify.rows) {
    console.log(`  ${r.slug.padEnd(15)} ${r.name.padEnd(20)} (${r.n} occupancies)`)
  }

  console.log(`\n${'═'.repeat(70)}`)
  console.log(`✓ Designs seeded. Phase 6.5 (--media) lands next.`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── MEDIA PHASE ─────────────────────────

/** Build the upload manifest. Files with name collisions across folders
 *  get a folder prefix; standalone names keep their original filename
 *  (which already encodes the series). */
function buildMediaManifest(): Array<FsFile & { safeFilename: string }> {
  const files = scanFs()
  const nameCount = new Map<string, number>()
  for (const f of files) nameCount.set(f.filename, (nameCount.get(f.filename) ?? 0) + 1)

  return files.map((f) => {
    let safe = f.filename
    if (nameCount.get(f.filename)! > 1) {
      // Disambiguate with the folder + subfolder context.
      const prefix = f.subfolder ? `${f.folder}-${f.subfolder}-` : `${f.folder}-`
      safe = prefix + f.filename
    }
    return { ...f, safeFilename: safe }
  })
}

async function runMedia(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`📦 MEDIA — Phase 6.5 ${APPLY ? '✍️  APPLY MODE' : '🔍 DRY-RUN'}`)
  console.log(`${'═'.repeat(70)}\n`)

  const manifest = buildMediaManifest()
  const collisions = manifest.filter((f) => f.safeFilename !== f.filename)
  console.log(`Manifest: ${manifest.length} files`)
  console.log(`  filename collisions resolved: ${collisions.length}`)
  if (collisions.length > 0 && collisions.length <= 10) {
    for (const c of collisions.slice(0, 5)) {
      console.log(`    ${c.relPath} → ${c.safeFilename}`)
    }
  }

  // Idempotency: pre-load existing filenames so re-runs skip uploaded files.
  const existing = await client.query<{ id: number; filename: string }>(
    `SELECT id, filename FROM media WHERE filename IS NOT NULL`,
  )
  const existingByName = new Map<string, number>()
  for (const r of existing.rows) existingByName.set(r.filename, r.id)
  console.log(`  ${existingByName.size} media records already exist (idempotent skip)`)

  const toUpload = manifest.filter((f) => !existingByName.has(f.safeFilename))
  console.log(`  ${toUpload.length} new uploads needed`)

  if (!APPLY) {
    console.log(`\n🔍 DRY-RUN — would upload ${toUpload.length} files to ${MEDIA_DIR}.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  // Ensure media dir exists
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true })

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`✍️  UPLOADING ${toUpload.length} files`)
  console.log(`${'─'.repeat(70)}`)

  // Build mapping that includes existing files too — Phase 6.6 needs the
  // full filename → media_id lookup.
  const mediaMap: Record<string, number> = {}
  for (const [filename, id] of existingByName) {
    mediaMap[filename] = id
  }
  // Map by ORIGINAL relPath too for products-phase lookup
  const relPathMap: Record<string, number> = {}

  let inserted = 0
  let skipped = 0
  let errors = 0
  const t0 = Date.now()

  // Process sequentially in a single transaction — simpler than parallel
  // for ~600 small inserts at sub-second total time.
  await client.query('BEGIN')
  try {
    for (let i = 0; i < manifest.length; i++) {
      const f = manifest[i]!
      try {
        // Skip if already uploaded
        const existingId = existingByName.get(f.safeFilename)
        if (existingId != null) {
          relPathMap[f.relPath] = existingId
          mediaMap[f.safeFilename] = existingId
          skipped++
          continue
        }

        // Copy file
        const targetPath = path.join(MEDIA_DIR, f.safeFilename)
        fs.copyFileSync(f.absPath, targetPath)
        const stat = fs.statSync(targetPath)

        // Read dimensions
        const meta = await sharp(targetPath).metadata()

        // Insert media row
        const r = await client.query<{ id: number }>(
          `INSERT INTO media (
            filename, url, mime_type, filesize, width, height,
            focal_x, focal_y, created_at, updated_at
          ) VALUES ($1, $2, 'image/webp', $3, $4, $5, 50, 50, NOW(), NOW())
          RETURNING id`,
          [
            f.safeFilename,
            `/api/media/file/${f.safeFilename}`,
            stat.size,
            meta.width ?? 0,
            meta.height ?? 0,
          ],
        )
        const id = r.rows[0]!.id
        relPathMap[f.relPath] = id
        mediaMap[f.safeFilename] = id
        inserted++

        if ((inserted + skipped) % 50 === 0) {
          const dt = ((Date.now() - t0) / 1000).toFixed(1)
          console.log(`  … ${inserted} inserted, ${skipped} skipped, ${errors} errors (${dt}s)`)
        }
      } catch (e: any) {
        errors++
        console.error(`  ✗ ${f.relPath}: ${e.message || e}`)
      }
    }

    await client.query('COMMIT')
  } catch (e: any) {
    await client.query('ROLLBACK')
    console.error(`\n✗ Transaction aborted: ${e.message || e}\n`)
    throw e
  }

  const dt = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`\n  ✓ ${inserted} inserted, ${skipped} skipped, ${errors} errors in ${dt}s`)

  // Persist the map for Phase 6.6
  fs.writeFileSync(
    MEDIA_MAP_PATH,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        byFilename: mediaMap,
        byRelPath: relPathMap,
      },
      null,
      2,
    ),
  )
  console.log(`  ✓ Wrote media map → ${MEDIA_MAP_PATH}`)
  console.log(`${'═'.repeat(70)}`)
  console.log(`✓ Media uploaded. Phase 6.6 (--products) lands next.`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── PRODUCTS PHASE ─────────────────────────

/** Map xlsx piece-type → Categories slug (matches what 6.3 inserted). */
const PIECE_TYPE_TO_SLUG: Record<string, string> = {
  'baby-bed': 'baby',
  'single-bed': 'single',
  'double-bed': 'double',
  'bunk-bed': 'bunk',
  'convertible-bed': 'convertible',
  'nightstand': 'nightstand',
  'vanity': 'vanity',
  'study-desk': 'study-desk',
  'bookcase': 'bookcase',
  'file': 'file-cabinet', // xlsx uses 'file', tree uses 'file-cabinet'
  'wardrobe': 'wardrobe',
  'sliding-wardrobe': 'sliding',
  'combined-wardrobe': 'wardrobe', // D2: fold into wardrobe
  'display-cabinet': 'display-cabinet',
  'console': 'console',
  'standing-mirror': 'standing-mirror',
  'table-mirror': 'table-mirror',
  'wall-mirror': 'wall-mirror',
  'vanity-chair': 'vanity-chair',
  'study-chair': 'study-chair',
  'loveseat': 'loveseat',
  'bed-box': 'bed-box',
  'bed-guard': 'bed-guard',
  'bed-jack': 'bed-jack',
  'changing-table': 'changing-table',
  'changing-top': 'changing-top',
  'wall-shelf': 'wall-shelf',
}

/** Parse the xlsx `attributes` column ("size=140,footboard=high") into a record. */
function parseAttributes(attrs: string | null): Record<string, string> {
  if (!attrs) return {}
  const out: Record<string, string> = {}
  for (const pair of attrs.split(',')) {
    const [k, v] = pair.split('=')
    if (k && v) out[k.trim()] = v.trim()
  }
  return out
}

async function runProducts(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`📦 PRODUCTS — Phase 6.6 ${APPLY ? '✍️  APPLY MODE' : '🔍 DRY-RUN'}`)
  console.log(`${'═'.repeat(70)}\n`)

  // Load media map from 6.5
  let mediaMap: { byFilename: Record<string, number>; byRelPath: Record<string, number> }
  if (!fs.existsSync(MEDIA_MAP_PATH)) {
    console.error(`❌ ${MEDIA_MAP_PATH} not found — run --media --apply first.`)
    process.exit(1)
  }
  mediaMap = JSON.parse(fs.readFileSync(MEDIA_MAP_PATH, 'utf8'))
  console.log(`Loaded media map: ${Object.keys(mediaMap.byFilename).length} filenames`)

  // Read xlsx products sheet
  const { products: xlsxProducts } = readProductsXlsx()
  console.log(`Xlsx rows: ${xlsxProducts.length}`)

  // Pre-fetch designs + categories
  const designs = await client.query<{ id: number; slug: string }>(
    `SELECT id, slug FROM designs`,
  )
  const designBySlug = new Map(designs.rows.map((d) => [d.slug, d.id]))

  const cats = await client.query<{ id: number; slug: string }>(
    `SELECT id, slug FROM categories`,
  )
  const catBySlug = new Map(cats.rows.map((c) => [c.slug, c.id]))

  // Group xlsx rows by (series, type) since multiple rows = variants of same product
  type Grouped = { series: string; type: string; rows: XlsxProductRow[] }
  const groups = new Map<string, Grouped>()
  for (const r of xlsxProducts) {
    const series = r.series ?? '-'
    const type = r.type ?? ''
    const key = `${series}|${type}`
    if (!groups.has(key)) groups.set(key, { series, type, rows: [] })
    groups.get(key)!.rows.push(r)
  }
  console.log(`Grouped into ${groups.size} distinct (series, piece-type) combinations = product records`)

  // Sample
  console.log(`\nSample groupings (first 3):`)
  let sampleI = 0
  for (const g of groups.values()) {
    if (sampleI >= 3) break
    console.log(`  ${g.series}/${g.type}: ${g.rows.length} variant row(s)`)
    sampleI++
  }

  if (!APPLY) {
    console.log(`\n🔍 DRY-RUN — would create ${groups.size} products + ${xlsxProducts.length} variants.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`✍️  CREATING ${groups.size} products`)
  console.log(`${'─'.repeat(70)}`)

  let created = 0
  let skipped = 0
  let errors = 0
  let galleryRefs = 0
  const productIdsBySeriesType: Record<string, number> = {}

  // Pre-fetch existing slugs for idempotency.
  const existingSlugs = await client.query<{ id: number; slug: string }>(
    `SELECT id, slug FROM products`,
  )
  const productBySlug = new Map(existingSlugs.rows.map((r) => [r.slug, r.id]))

  // No outer transaction — per-row error in PG poisons the rest of the txn.
  // Each INSERT is its own implicit txn; we use slug-based idempotency for
  // re-runs.
  for (const [key, g] of groups.entries()) {
    try {
      if (g.series === '-') {
        // D3: series-less rows (bed-jack accessories) — Products.design is
        // NOT NULL in the legacy schema. Defer per operator decision.
        skipped++
        continue
      }
      const designId = designBySlug.get(g.series)
      if (designId == null) {
        throw new Error(`design not found: ${g.series}`)
      }

      const categorySlug = PIECE_TYPE_TO_SLUG[g.type]
      if (!categorySlug) throw new Error(`no category mapping for piece_type: ${g.type}`)
      const categoryId = catBySlug.get(categorySlug)
      if (categoryId == null) throw new Error(`category not found: ${categorySlug}`)

      const name = `${g.series} ${g.type}`
      const slug = `${g.series}-${g.type}`

      // Idempotency: skip if slug already exists.
      const existingId = productBySlug.get(slug)
      if (existingId != null) {
        productIdsBySeriesType[key] = existingId
        skipped++
        continue
      }

      // Base price: first row with a price; else 0 (operator refines later).
      // base_price_rials is NOT NULL in the schema — D3 inquiry-only products
      // get 0 here and operator updates via admin.
      const firstPrice = g.rows.find((r) => r.price_rial)?.price_rial ?? 0
      const anyVisible = g.rows.some((r) => r.visible === 'yes')

      const r = await client.query<{ id: number }>(
        `INSERT INTO products (
          name, slug, design_id, piece_type, sku,
          base_price_rials, availability, lead_time_days,
          status, inquiry_enabled,
          created_at, updated_at
        ) VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id`,
        [
          name, slug, designId, slug,
          firstPrice, anyVisible ? 'in_stock' : 'made_to_order',
          14, anyVisible ? 'published' : 'draft', true,
        ],
      )
      const productId = r.rows[0]!.id
      productIdsBySeriesType[key] = productId
      productBySlug.set(slug, productId)

      // Link category via products_rels
      await client.query(
        `INSERT INTO products_rels ("order", parent_id, path, categories_id)
         VALUES (1, $1, 'categoryIds', $2)`,
        [productId, categoryId],
      )

      // Gallery: link media files whose path starts with this series and whose
      // basename contains the piece-type token. Tolerates folder finish-variants
      // (series=elizabeth maps to folders elizabeth-cream/, elizabeth-gray/).
      const seriesPaths = Object.keys(mediaMap.byRelPath).filter((p) => {
        const folder = p.split('/')[0]!
        return folder === g.series || folder.startsWith(`${g.series}-`)
      })
      const galleryFiles: number[] = []
      for (const relPath of seriesPaths) {
        const fname = path.basename(relPath)
        if (fname.includes(g.type)) {
          galleryFiles.push(mediaMap.byRelPath[relPath]!)
        }
      }
      for (let i = 0; i < galleryFiles.length; i++) {
        await client.query(
          `INSERT INTO products_rels ("order", parent_id, path, media_id)
           VALUES ($1, $2, 'gallery', $3)`,
          [i + 2, productId, galleryFiles[i]], // order starts at 2 (1 = category)
        )
        galleryRefs++
      }

      created++
      if (created % 50 === 0) {
        console.log(`  … ${created} created, ${skipped} skipped, ${errors} errors, ${galleryRefs} gallery refs`)
      }
    } catch (e: any) {
      errors++
      console.error(`  ✗ ${key}: ${e.message || e}`)
    }
  }

  // Save product IDs for Phase 6.7 (variants)
  fs.writeFileSync(
    '/tmp/product-ids.json',
    JSON.stringify({ productIdsBySeriesType }, null, 2),
  )

  console.log(`\n  ✓ ${created} products created, ${errors} errors`)
  console.log(`  ✓ Wrote product IDs → /tmp/product-ids.json`)
  console.log(`${'═'.repeat(70)}`)
  console.log(`✓ Products seeded. Phase 6.7 (--variants) lands next (TODO).`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── VARIANTS PHASE ─────────────────────────

async function runVariants(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`🔀 VARIANTS — Phase 6.7 ${APPLY ? '✍️  APPLY MODE' : '🔍 DRY-RUN'}`)
  console.log(`${'═'.repeat(70)}\n`)

  if (!fs.existsSync('/tmp/product-ids.json')) {
    console.error(`❌ /tmp/product-ids.json not found — run --products --apply first.`)
    process.exit(1)
  }
  const { productIdsBySeriesType } = JSON.parse(
    fs.readFileSync('/tmp/product-ids.json', 'utf8'),
  ) as { productIdsBySeriesType: Record<string, number> }

  const mediaMap = JSON.parse(fs.readFileSync(MEDIA_MAP_PATH, 'utf8')) as {
    byFilename: Record<string, number>
    byRelPath: Record<string, number>
  }

  const { products: xlsxProducts } = readProductsXlsx()
  console.log(`Xlsx rows: ${xlsxProducts.length}`)

  // Group by (series, type) — each row in a group is one variant of that product.
  const groups = new Map<string, XlsxProductRow[]>()
  for (const r of xlsxProducts) {
    if (!r.series || r.series === '-' || !r.type) continue
    const key = `${r.series}|${r.type}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  // Only products with MULTIPLE rows OR non-null attributes need variants.
  // Single-row product with no attributes = single SKU, no variant needed.
  const variantCandidates: Array<{ key: string; row: XlsxProductRow; idx: number }> = []
  for (const [key, rows] of groups.entries()) {
    if (rows.length === 1 && !rows[0]!.attributes) continue
    for (let i = 0; i < rows.length; i++) {
      variantCandidates.push({ key, row: rows[i]!, idx: i })
    }
  }
  console.log(`Variant candidates: ${variantCandidates.length} (rows with attrs or in multi-row groups)`)

  if (!APPLY) {
    console.log(`\nSample (first 5):`)
    for (const c of variantCandidates.slice(0, 5)) {
      const attrs = parseAttributes(c.row.attributes)
      console.log(`  ${c.key} [#${c.idx}] attrs=${JSON.stringify(attrs)} media=${c.row.media_files ?? '(none)'}`)
    }
    console.log(`\n🔍 DRY-RUN — would create ${variantCandidates.length} variants.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`✍️  CREATING ${variantCandidates.length} variants`)
  console.log(`${'─'.repeat(70)}`)

  // Idempotency: pre-load existing variant SKUs.
  const existing = await client.query<{ sku: string }>(`SELECT sku FROM product_variants`)
  const existingSkus = new Set(existing.rows.map((r) => r.sku))

  let created = 0
  let skipped = 0
  let errors = 0
  let axesRows = 0
  let withImage = 0

  // Build an original-filename → media_id map. Where multiple files share the
  // bare name (post-collision rename), we can't disambiguate from filename
  // alone, so we accept the first match — variant images for those few rows
  // may be wrong; operator refines via admin if needed.
  const byOriginalFilename = new Map<string, number>()
  for (const [relPath, id] of Object.entries(mediaMap.byRelPath)) {
    const bare = path.basename(relPath)
    if (!byOriginalFilename.has(bare)) byOriginalFilename.set(bare, id)
  }

  for (const c of variantCandidates) {
    try {
      const productId = productIdsBySeriesType[c.key]
      if (productId == null) {
        skipped++
        continue
      }

      const attrs = parseAttributes(c.row.attributes)

      // xlsx `media_files` is SEMICOLON-separated (not comma — found the
      // hard way). e.g. "parla-double-bed-160-cream.webp; parla-double-
      // bed-160-green.webp; parla-double-bed-160-v2-cream.webp; …" lists
      // 4 files across 2 finishes. Split and group by detected finish so
      // each finish becomes its own variant — that's the "color variant"
      // axis the operator expects to see in the picker.
      const mediaFiles = (c.row.media_files ?? '')
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)

      const filesByFinish = new Map<string, string[]>()
      for (const fname of mediaFiles) {
        const f = finishFromMedia('', fname) ?? '_default'
        if (!filesByFinish.has(f)) filesByFinish.set(f, [])
        filesByFinish.get(f)!.push(fname)
      }
      const realFinishes = [...filesByFinish.keys()].filter((f) => f !== '_default')

      // Build the variant set:
      //  - no finishes detected → 1 variant with just xlsx attrs
      //  - 1+ finishes detected → one variant per finish (with finish axis)
      const subVariants: Array<{ axes: Record<string, string>; mediaFile: string | null }> = []
      if (realFinishes.length === 0) {
        subVariants.push({ axes: { ...attrs }, mediaFile: mediaFiles[0] ?? null })
      } else {
        for (const finish of realFinishes) {
          subVariants.push({
            axes: { ...attrs, finish },
            mediaFile: filesByFinish.get(finish)?.[0] ?? null,
          })
        }
      }

      let subIdx = 0
      for (const sv of subVariants) {
        // SKU — slug-like and unique per variant
        const productSlug = `${c.row.series}-${c.row.type}`
        const axesPart = Object.entries(sv.axes)
          .map(([k, v]) => `${k}-${v}`)
          .join('-')
        const sku = axesPart ? `${productSlug}-${axesPart}` : `${productSlug}-${c.idx}-${subIdx}`

        if (existingSkus.has(sku)) {
          skipped++
          subIdx++
          continue
        }

        // Image lookup — uses the FIRST file for this finish (not the whole
        // semicolon-separated string — the previous bug).
        let imageId: number | null = null
        if (sv.mediaFile) {
          imageId = byOriginalFilename.get(sv.mediaFile) ?? mediaMap.byFilename[sv.mediaFile] ?? null
        }
        if (imageId != null) withImage++

        // Label: keyed Persian summary. Real translation happens later in
        // the --persian-names phase; this is the bootstrap form.
        const label = Object.entries(sv.axes)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ') || 'پیش‌فرض'

        const r = await client.query<{ id: number }>(
          `INSERT INTO product_variants (
            product_id, sku, label, price_delta_rials, availability,
            image_id, display_order, created_at, updated_at
          ) VALUES ($1, $2, $3, 0, $4, $5, $6, NOW(), NOW())
          RETURNING id`,
          [
            productId, sku, label,
            c.row.visible === 'yes' ? 'in_stock' : 'made_to_order',
            imageId, c.idx * 10 + subIdx,
          ],
        )
        const variantId = r.rows[0]!.id
        existingSkus.add(sku)

        // Axes child rows
        let axisIdx = 0
        for (const [k, v] of Object.entries(sv.axes)) {
          await client.query(
            `INSERT INTO product_variants_axes ("_order", "_parent_id", id, key, value)
             VALUES ($1, $2, $3, $4, $5)`,
            [axisIdx, variantId, `${variantId}-axis-${axisIdx}`, k, String(v)],
          )
          axisIdx++
          axesRows++
        }

        created++
        if (created % 100 === 0) {
          console.log(`  … ${created} variants created, ${skipped} skipped, ${errors} errors`)
        }
        subIdx++
      }
    } catch (e: any) {
      errors++
      if (errors <= 5) console.error(`  ✗ ${c.key}[${c.idx}]: ${e.message || e}`)
    }
  }

  console.log(`\n  ✓ ${created} variants created, ${skipped} skipped, ${errors} errors`)
  console.log(`  ✓ ${axesRows} axes rows, ${withImage} variants linked to specific media`)

  // Verify
  const verify = await client.query<{ c: string; n: number }>(`
    SELECT 'variants' AS c, count(*)::int AS n FROM product_variants
    UNION ALL SELECT 'axes', count(*)::int FROM product_variants_axes
    UNION ALL SELECT 'with_image', count(*)::int FROM product_variants WHERE image_id IS NOT NULL
  `)
  console.log(`\nVerification:`)
  for (const r of verify.rows) console.log(`  ${r.c}: ${r.n}`)

  console.log(`\n${'═'.repeat(70)}`)
  console.log(`✓ Variants seeded. Final smoke + D2 outlier cleanup next.`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── PERSIAN-NAMES PHASE ─────────────────────────

/**
 * Map xlsx piece-type slug → Persian product-name prefix.
 * Curated for product naming (shorter / cleaner than the raw category
 * name which can be a long descriptive phrase like
 * "تخت نوزاد دومظوره (نوزاد نوجوان، کاناپه ای)").
 */
const PIECE_TYPE_PERSIAN: Record<string, string> = {
  'baby-bed': 'تخت نوزاد',
  'single-bed': 'تخت یک نفره',
  'double-bed': 'تخت دونفره',
  'bunk-bed': 'تخت دوطبقه',
  'convertible-bed': 'تخت نوزاد دومنظوره',
  'nightstand': 'پاتختی',
  'vanity': 'میز آرایش',
  'study-desk': 'میز تحریر',
  'bookcase': 'کتابخانه',
  'file': 'فایل',
  'wardrobe': 'کمد',
  'sliding-wardrobe': 'کمد ریلی',
  'combined-wardrobe': 'کمد ترکیبی',
  'display-cabinet': 'ویترین',
  'console': 'کنسول',
  'standing-mirror': 'آینه قدی',
  'table-mirror': 'آینه رومیزی',
  'wall-mirror': 'آینه دیواری',
  'vanity-chair': 'صندلی میز آرایش',
  'study-chair': 'صندلی میز تحریر',
  'loveseat': 'لاوست',
  'bed-box': 'باکس تخت',
  'bed-guard': 'حفاظ تخت',
  'bed-jack': 'جک کفی تخت',
  'changing-table': 'میز تعویض',
  'changing-top': 'صفحه تعویض',
  'wall-shelf': 'شلف دیواری',
}

// ── Variant axis key/value Persian map (used by --persian-names) ──

const AXIS_KEY_PERSIAN: Record<string, string> = {
  bunk_configuration: 'پیکربندی',
  conversion: 'تبدیل',
  door_material: 'جنس درب',
  doors: 'تعداد درب',
  drawers: 'تعداد کشو',
  finish: 'روکش',
  footboard: 'تاج',
  headboard_style: 'سبک تاج',
  pieces: 'تعداد قطعه',
  shape: 'شکل',
  size: 'اندازه',
  width: 'عرض',
}

const AXIS_VALUE_PERSIAN: Record<string, Record<string, string>> = {
  bunk_configuration: {
    bunk_with_trundle: 'دوطبقه با کشوی پایینی',
    full_bunk: 'دوطبقه کامل',
    lower_bed: 'تخت پایینی',
  },
  conversion: { sofa: 'نیمکت', teen: 'نوجوان' },
  door_material: { glass: 'شیشه', mdf: 'ام‌دی‌اف' },
  finish: { cream: 'کرم', gray: 'خاکستری', green: 'سبز', 'two-stage': 'دومرحله‌ای' },
  footboard: { high: 'بلند', low: 'کوتاه' },
  headboard_style: { new: 'جدید', prime: 'پرایم' },
  shape: { oval: 'بیضی', round: 'گرد' },
  // Numeric axes (doors/drawers/pieces/size/width) get Persian digits via
  // toPersianDigits below.
}

const LATIN_TO_PERSIAN_DIGIT: Record<string, string> = {
  '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
  '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹',
}

function toPersianDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => LATIN_TO_PERSIAN_DIGIT[d] ?? d)
}

function persianAxisValue(key: string, value: string): string {
  const lookup = AXIS_VALUE_PERSIAN[key]?.[value]
  if (lookup) return lookup
  // Numeric or unmapped → just Persian-digit it. "2m" → "۲ متر"
  if (value.endsWith('m') && /^\d/.test(value)) {
    return `${toPersianDigits(value.slice(0, -1))} متر`
  }
  return toPersianDigits(value)
}

function buildVariantLabelPersian(axes: Array<{ key: string; value: string }>): string {
  if (axes.length === 0) return 'پیش‌فرض'
  return axes
    .map((a) => `${AXIS_KEY_PERSIAN[a.key] ?? a.key}: ${persianAxisValue(a.key, a.value)}`)
    .join(' · ')
}

async function runPersianNames(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`🌐 PERSIAN-NAMES — ${APPLY ? '✍️  APPLY MODE' : '🔍 DRY-RUN'}`)
  console.log(`${'═'.repeat(70)}\n`)

  // Get all products joined with their design name. The xlsx piece-type
  // is encoded in the product slug as `<design-slug>-<piece-type>`, so
  // we strip the design slug off the front to recover it.
  const rows = await client.query<{
    id: number
    slug: string
    name: string
    design_id: number
    design_slug: string
    design_name: string
  }>(`
    SELECT p.id, p.slug, p.name, p.design_id, d.slug AS design_slug, d.name AS design_name
    FROM products p
    JOIN designs d ON d.id = p.design_id
    ORDER BY p.id
  `)
  console.log(`Loaded ${rows.rowCount} products with designs joined.`)

  const updates: Array<{ id: number; oldName: string; newName: string }> = []
  const skipped: Array<{ id: number; slug: string; reason: string }> = []

  for (const r of rows.rows) {
    const prefix = `${r.design_slug}-`
    if (!r.slug.startsWith(prefix)) {
      skipped.push({ id: r.id, slug: r.slug, reason: `slug doesn't start with ${prefix}` })
      continue
    }
    const xlsxType = r.slug.slice(prefix.length)
    const persianPiece = PIECE_TYPE_PERSIAN[xlsxType]
    if (!persianPiece) {
      skipped.push({ id: r.id, slug: r.slug, reason: `no Persian mapping for type '${xlsxType}'` })
      continue
    }
    const newName = `${persianPiece} ${r.design_name}`
    if (newName === r.name) continue // already set
    updates.push({ id: r.id, oldName: r.name, newName })
  }

  console.log(`\n${updates.length} products to rename, ${skipped.length} skipped.`)
  if (skipped.length > 0 && skipped.length <= 10) {
    for (const s of skipped) {
      console.log(`  skip ${s.slug}: ${s.reason}`)
    }
  }

  if (updates.length > 0) {
    console.log(`\nSample (first 8):`)
    for (const u of updates.slice(0, 8)) {
      console.log(`  ${u.oldName.padEnd(36)} → ${u.newName}`)
    }
  }

  if (!APPLY) {
    console.log(`\n🔍 DRY-RUN. Pass --apply to write.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`✍️  UPDATING ${updates.length} product names`)
  console.log(`${'─'.repeat(70)}`)

  let updated = 0
  let errors = 0
  for (const u of updates) {
    try {
      await client.query(`UPDATE products SET name = $1, updated_at = NOW() WHERE id = $2`, [
        u.newName,
        u.id,
      ])
      updated++
    } catch (e: any) {
      errors++
      console.error(`  ✗ id=${u.id}: ${e.message || e}`)
    }
  }

  console.log(`\n  ✓ ${updated} products renamed, ${errors} errors`)

  // ─────────────────── Variant labels ───────────────────
  console.log(`\n${'─'.repeat(70)}`)
  console.log(`Variant labels`)
  console.log(`${'─'.repeat(70)}`)

  // Fetch every variant + its axes in a single query
  const variantRows = await client.query<{
    id: number
    sku: string
    label: string | null
    axis_key: string | null
    axis_value: string | null
    axis_order: number | null
  }>(`
    SELECT v.id, v.sku, v.label,
           a.key AS axis_key, a.value AS axis_value, a."_order" AS axis_order
    FROM product_variants v
    LEFT JOIN product_variants_axes a ON a."_parent_id" = v.id
    ORDER BY v.id, a."_order"
  `)

  // Group axes by variant id
  const variantAxes = new Map<number, { sku: string; oldLabel: string | null; axes: Array<{ key: string; value: string }> }>()
  for (const r of variantRows.rows) {
    if (!variantAxes.has(r.id)) {
      variantAxes.set(r.id, { sku: r.sku, oldLabel: r.label, axes: [] })
    }
    if (r.axis_key && r.axis_value) {
      variantAxes.get(r.id)!.axes.push({ key: r.axis_key, value: r.axis_value })
    }
  }

  console.log(`Loaded ${variantAxes.size} variants with their axes.`)

  const variantUpdates: Array<{ id: number; oldLabel: string | null; newLabel: string }> = []
  for (const [id, v] of variantAxes.entries()) {
    const newLabel = buildVariantLabelPersian(v.axes)
    if (newLabel === v.oldLabel) continue
    variantUpdates.push({ id, oldLabel: v.oldLabel, newLabel })
  }
  console.log(`${variantUpdates.length} variant labels to rewrite.`)

  if (variantUpdates.length > 0) {
    console.log(`\nSample (first 8):`)
    for (const u of variantUpdates.slice(0, 8)) {
      console.log(`  ${(u.oldLabel ?? '(null)').padEnd(40)} → ${u.newLabel}`)
    }
  }

  if (!APPLY) {
    console.log(`\n🔍 DRY-RUN (variants). Already wrote product names if --apply.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  let vUpdated = 0
  let vErrors = 0
  for (const u of variantUpdates) {
    try {
      await client.query(`UPDATE product_variants SET label = $1, updated_at = NOW() WHERE id = $2`, [
        u.newLabel,
        u.id,
      ])
      vUpdated++
    } catch (e: any) {
      vErrors++
      console.error(`  ✗ variant id=${u.id}: ${e.message || e}`)
    }
  }

  console.log(`\n  ✓ ${vUpdated} variant labels updated, ${vErrors} errors`)

  // Verify sample
  const sample = await client.query<{ slug: string; name: string }>(
    `SELECT slug, name FROM products ORDER BY random() LIMIT 4`,
  )
  console.log(`\nRandom product sample:`)
  for (const r of sample.rows) console.log(`  ${r.slug.padEnd(36)} ${r.name}`)

  const vSample = await client.query<{ sku: string; label: string }>(
    `SELECT sku, label FROM product_variants ORDER BY random() LIMIT 6`,
  )
  console.log(`\nRandom variant sample:`)
  for (const r of vSample.rows) console.log(`  ${r.sku.padEnd(44)} ${r.label}`)

  console.log(`\n${'═'.repeat(70)}`)
  console.log(`✓ Persian names + variant labels applied.`)
  console.log(`${'═'.repeat(70)}\n`)
}

// ───────────────────────── BEDROOM-SET MEDIA PHASE ─────────────────────────

/**
 * Link the per-series carousel images from /home/ahmad/imports/allProducts/
 * to each design's `sliderMedia` field. These are the tiles the
 * /bedroom-set index DesignsSlider renders. Filenames map to design
 * slugs with minor aliasing (luka → lukaplus, mucha → mocha) and finish
 * suffix stripping (elizabeth-cream → elizabeth).
 *
 * Idempotent: re-runs update existing media records by filename, and
 * re-set design.slider_media_id. Files that don't match any design
 * (e.g. monte.webp had no series) are logged as unmatched.
 */
const ALL_PRODUCTS_DIR = path.join(IMPORTS_ROOT, 'allProducts')
const BEDROOM_SET_MEDIA_ALIASES: Record<string, string> = {
  luka: 'lukaplus',
  mucha: 'mocha',
}

function webpDimensions(filePath: string): { width: number; height: number } {
  // Minimal WebP header parser — avoids the sharp dependency cost for a
  // 13-file one-off. Returns {0,0} on unknown / unsupported chunks; the
  // media record still inserts, just with width=height=0 (operator can
  // re-derive via admin if needed).
  const buf = fs.readFileSync(filePath, { encoding: null }).subarray(0, 64)
  const chunk = buf.subarray(12, 16).toString('ascii')
  if (chunk === 'VP8 ') {
    const w = (buf[26]! | (buf[27]! << 8)) & 0x3fff
    const h = (buf[28]! | (buf[29]! << 8)) & 0x3fff
    return { width: w, height: h }
  }
  if (chunk === 'VP8L') {
    const bits = buf[21]! | (buf[22]! << 8) | (buf[23]! << 16) | (buf[24]! << 24)
    const w = (bits & 0x3fff) + 1
    const h = ((bits >>> 14) & 0x3fff) + 1
    return { width: w, height: h }
  }
  if (chunk === 'VP8X') {
    const w = (buf[24]! | (buf[25]! << 8) | (buf[26]! << 16)) + 1
    const h = (buf[27]! | (buf[28]! << 8) | (buf[29]! << 16)) + 1
    return { width: w, height: h }
  }
  return { width: 0, height: 0 }
}

async function runBedroomSetMedia(client: pg.Client) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`🖼️  BEDROOM-SET CAROUSEL MEDIA — ${APPLY ? '✍️  APPLY MODE' : '🔍 DRY-RUN'}`)
  console.log(`${'═'.repeat(70)}\n`)

  if (!fs.existsSync(ALL_PRODUCTS_DIR)) {
    console.error(`❌ ${ALL_PRODUCTS_DIR} not found. Provision the allProducts folder first.`)
    process.exit(1)
  }

  const designsRes = await client.query<{ id: number; slug: string }>(`SELECT id, slug FROM designs`)
  const designIdBySlug = new Map(designsRes.rows.map((d) => [d.slug, d.id]))

  type Plan = { fname: string; slug: string; designId: number; safeFilename: string }
  const plan: Plan[] = []
  const unmatched: Array<{ fname: string; tried: string }> = []

  for (const fname of fs.readdirSync(ALL_PRODUCTS_DIR).sort()) {
    if (!fname.endsWith('.webp')) continue
    let base = fname.slice(0, -'.webp'.length)
    for (const suf of ['-cream', '-gray', '-green', '-2staged']) {
      if (base.endsWith(suf)) {
        base = base.slice(0, -suf.length)
        break
      }
    }
    const slug = BEDROOM_SET_MEDIA_ALIASES[base] ?? base
    const designId = designIdBySlug.get(slug)
    if (designId == null) {
      unmatched.push({ fname, tried: slug })
      continue
    }
    plan.push({ fname, slug, designId, safeFilename: `bedroom-set-${slug}.webp` })
  }

  console.log(`Manifest:`)
  console.log(`  ${plan.length} files map to a design`)
  console.log(`  ${unmatched.length} files have no matching design`)

  if (!APPLY) {
    console.log(`\nSample (first 6):`)
    for (const p of plan.slice(0, 6)) {
      console.log(`  ${p.fname.padEnd(24)} → design[${p.designId}] ${p.slug}`)
    }
    if (unmatched.length > 0) {
      console.log(`\nUnmatched:`)
      for (const u of unmatched) console.log(`  ${u.fname} (tried slug="${u.tried}")`)
    }
    console.log(`\n🔍 DRY-RUN. Pass --apply to write.`)
    console.log(`${'═'.repeat(70)}\n`)
    return
  }

  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true })

  let copied = 0
  let updated = 0
  let inserted = 0
  for (const p of plan) {
    const srcPath = path.join(ALL_PRODUCTS_DIR, p.fname)
    const dstPath = path.join(MEDIA_DIR, p.safeFilename)
    fs.copyFileSync(srcPath, dstPath)
    copied++

    const { width, height } = webpDimensions(dstPath)
    const size = fs.statSync(dstPath).size

    // Upsert media row by filename
    const found = await client.query<{ id: number }>(
      `SELECT id FROM media WHERE filename = $1 LIMIT 1`,
      [p.safeFilename],
    )
    let mediaId: number
    if (found.rowCount && found.rows[0]) {
      mediaId = found.rows[0].id
      await client.query(
        `UPDATE media SET filesize = $1, width = $2, height = $3, updated_at = NOW() WHERE id = $4`,
        [size, width, height, mediaId],
      )
      updated++
    } else {
      const ins = await client.query<{ id: number }>(
        `INSERT INTO media (filename, url, mime_type, filesize, width, height, focal_x, focal_y, created_at, updated_at)
         VALUES ($1, $2, 'image/webp', $3, $4, $5, 50, 50, NOW(), NOW())
         RETURNING id`,
        [p.safeFilename, `/api/media/file/${p.safeFilename}`, size, width, height],
      )
      mediaId = ins.rows[0]!.id
      inserted++
    }

    await client.query(
      `UPDATE designs SET slider_media_id = $1, updated_at = NOW() WHERE id = $2`,
      [mediaId, p.designId],
    )
  }

  console.log(`\n  ✓ ${copied} files copied`)
  console.log(`  ✓ ${inserted} media inserted, ${updated} updated`)
  console.log(`  ✓ ${plan.length} designs linked to slider media`)
  if (unmatched.length > 0) {
    console.log(`\n  ⚠️  ${unmatched.length} unmatched files:`)
    for (const u of unmatched) console.log(`     ${u.fname}`)
  }
  console.log(`\n${'═'.repeat(70)}\n`)
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
  } else if (PHASE === 'categories') {
    await runCategories(client)
  } else if (PHASE === 'designs') {
    await runDesigns(client)
  } else if (PHASE === 'media') {
    await runMedia(client)
  } else if (PHASE === 'products') {
    await runProducts(client)
  } else if (PHASE === 'variants') {
    await runVariants(client)
  } else if (PHASE === 'persian-names') {
    await runPersianNames(client)
  } else if (PHASE === 'bedroom-set-media') {
    await runBedroomSetMedia(client)
  } else {
    console.error(`\n❌ Phase "${PHASE}" not yet implemented.`)
    process.exit(1)
  }
} finally {
  await client.end()
}

process.exit(0)
