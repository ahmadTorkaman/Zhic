/**
 * Reconcile iron-series variant data (two targeted fixes).
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-11-iron-variants.mts          # dry-run (default)
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-11-iron-variants.mts --apply  # write
 *
 * Idempotent — re-running after --apply is a no-op.
 *
 * Fix 1 — iron-wardrobe (#424): add the missing doors=1 / door_material=mdf
 *   variant. The gallery already ships its image (media #515,
 *   iron-wardrobe-1-doors-mdf.webp) but no variant existed, so the 2×2
 *   doors×material matrix had a hole and that image sold an unbuyable config.
 *
 * Fix 2 — iron-standing-mirror (#418): remove the duplicate default variant.
 *   Two byte-identical "پیش‌فرض" variants (empty axes, image #509) exist; the
 *   convention is 0 or 1. Keep the lowest display_order, delete the rest.
 *
 * Direct pg (not the Payload local API): getPayload({config}) fails on Node 24
 * here (FU-7.1 @next/env destructure) — every reconcile-*.mts uses pg.
 */

import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── env (manual .env parse, mirrors seed-rooms.mts) ────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const envContent = readFileSync(resolve(__dirname, '../.env'), 'utf8')
  for (const line of envContent.split('\n')) {
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
const DATABASE_URI = process.env.DATABASE_URI
if (!DATABASE_URI) {
  console.error('DATABASE_URI not set')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
// --only=1 / --only=2 / --only=1,2 selects which fixes apply. Default: both.
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) ?? '').split('=')[1] ?? ''
const doFix1 = !ONLY || ONLY.includes('1')
const doFix2 = !ONLY || ONLY.includes('2')
const WARDROBE_ID = 424
const MIRROR_ID = 418
const NEW_SKU = 'iron-wardrobe-doors-1-door_material-mdf'
const NEW_IMAGE_ID = 515 // iron-wardrobe-1-doors-mdf.webp

const client = new pg.Client({ connectionString: DATABASE_URI })

type VRow = { id: number; sku: string; label: string | null; display_order: number | null; image_id: number | null }

async function axesOf(id: number) {
  const r = await client.query<{ key: string; value: string }>(
    `SELECT key, value FROM product_variants_axes WHERE _parent_id = $1 ORDER BY _order`,
    [id],
  )
  return r.rows
}

async function main() {
  await client.connect()
  console.log(`\n=== reconcile-11-iron-variants  (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  // ── Fix 1: add missing iron-wardrobe doors=1/door_material=mdf variant ────
  console.log('Fix 1 — iron-wardrobe (#424) missing doors=1/door_material=mdf variant')
  const existing = await client.query<VRow>(
    `SELECT id, sku FROM product_variants WHERE product_id = $1 ORDER BY display_order`,
    [WARDROBE_ID],
  )
  const has = existing.rows.some((v) => v.sku === NEW_SKU)
  if (has) {
    console.log('  ✓ already present — skipping')
  } else {
    // Verify the image exists, then build the label from real sibling labels
    // so ZWNJ / Persian digits match exactly.
    const img = await client.query(`SELECT id, filename FROM media WHERE id = $1`, [NEW_IMAGE_ID])
    if (img.rowCount === 0) throw new Error(`media #${NEW_IMAGE_ID} not found`)
    const glassLbl = await client.query<{ label: string }>(
      `SELECT label FROM product_variants WHERE sku = 'iron-wardrobe-doors-1-door_material-glass'`,
    )
    const mdfLbl = await client.query<{ label: string }>(
      `SELECT label FROM product_variants WHERE sku = 'iron-wardrobe-doors-2-door_material-mdf'`,
    )
    const doorsPart = (glassLbl.rows[0]?.label ?? 'تعداد درب: ۱').split(' · ')[0]
    const matPart = (mdfLbl.rows[0]?.label ?? 'جنس درب: ام‌دی‌اف').split(' · ')[1] ?? 'جنس درب: ام‌دی‌اف'
    const label = `${doorsPart} · ${matPart}`
    console.log(`  + INSERT variant sku=${NEW_SKU}`)
    console.log(`      label="${label}"  axes=[doors=1, door_material=mdf]  delta=0  in_stock  image=${NEW_IMAGE_ID} (${img.rows[0].filename})  display_order=5`)
    if (APPLY && doFix1) {
      await client.query('BEGIN')
      try {
        const ins = await client.query<{ id: number }>(
          `INSERT INTO product_variants (product_id, sku, label, price_delta_rials, availability, image_id, display_order, created_at, updated_at)
           VALUES ($1, $2, $3, 0, 'in_stock', $4, 5, NOW(), NOW()) RETURNING id`,
          [WARDROBE_ID, NEW_SKU, label, NEW_IMAGE_ID],
        )
        const vid = ins.rows[0].id
        const axes: [string, string][] = [['doors', '1'], ['door_material', 'mdf']]
        for (let i = 0; i < axes.length; i++) {
          await client.query(
            `INSERT INTO product_variants_axes ("_order", "_parent_id", id, key, value) VALUES ($1, $2, $3, $4, $5)`,
            [i, vid, `${vid}-axis-${i}`, axes[i][0], axes[i][1]],
          )
        }
        await client.query('COMMIT')
        console.log(`  ✓ created variant #${vid} (+${axes.length} axes)`)
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      }
    }
  }

  // ── Fix 2: dedup iron-standing-mirror default variants ───────────────────
  console.log('\nFix 2 — iron-standing-mirror (#418) duplicate default variant')
  const mv = await client.query<VRow>(
    `SELECT id, sku, label, display_order, image_id FROM product_variants WHERE product_id = $1 ORDER BY display_order, id`,
    [MIRROR_ID],
  )
  const defaults: VRow[] = []
  for (const v of mv.rows) {
    const ax = await axesOf(v.id)
    if (ax.length === 0) defaults.push(v)
  }
  if (defaults.length <= 1) {
    console.log(`  ✓ ${defaults.length} default variant — nothing to dedup`)
  } else {
    const keep = defaults[0] // lowest display_order, then lowest id
    const drop = defaults.slice(1)
    console.log(`  keep   #${keep.id} (sku=${keep.sku}, order=${keep.display_order})`)
    for (const d of drop) console.log(`  - DELETE #${d.id} (sku=${d.sku}, order=${d.display_order})`)
    if (APPLY && !doFix2) console.log('  (held — Fix 2 not selected by --only)')
    if (APPLY && doFix2) {
      for (const d of drop) {
        // Clear any concurrent-edit lock ref, then delete (axes cascade).
        await client.query(`DELETE FROM payload_locked_documents_rels WHERE product_variants_id = $1`, [d.id])
        await client.query(`DELETE FROM product_variants WHERE id = $1`, [d.id])
        console.log(`  ✓ deleted variant #${d.id}`)
      }
    }
  }

  console.log(`\n=== done ${APPLY ? '(applied)' : '(dry-run — re-run with --apply to write)'} ===\n`)
  await client.end()
}

main().catch(async (e) => {
  console.error(e)
  try { await client.end() } catch { /* noop */ }
  process.exit(1)
})
