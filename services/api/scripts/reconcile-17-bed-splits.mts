/**
 * Catalog audit batch — STAGE 3: bed splits.
 * Spec: docs/superpowers/specs/2026-06-26-catalog-design-audit-ledger.md
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-17-bed-splits.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-17-bed-splits.mts --apply  # write
 *
 * Per split design: create `{slug}-teen` (sizes <140) + `{slug}-double` (sizes >=140) bed
 * products, copy scalar fields + rels, partition variants (+all their axes), repoint incoming
 * refs to BOTH, swap combos (teen→teen-bed, double→double-bed, drop from baby), delete old bed.
 * Double base = old base + the size-jump; double variants rebased to delta 0.
 * Finish-fix (elizabeth cream/gray, parla cream/green): size variants lacking a finish axis are
 * expanded into one variant per finish value.
 * parla: special — 506 trimmed to teen, broken 582 repaired into parla-bed-double (kept, not deleted).
 * loof/skate: no split — bed retagged teen (drop baby); loof bed removed from baby combo.
 */
import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8')
  for (const line of env.split('\n')) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const i = t.indexOf('='); if (i > 0 && !process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim() }
} catch { /* env */ }
const APPLY = process.argv.includes('--apply')

const SPLITS = ['iron', 'lotus', 'lukaplus', 'verna', 'jacqueline', 'caroline', 'baloot', 'sento', 'elizabeth']
const FINISH: Record<string, string[]> = { elizabeth: ['cream', 'gray'], parla: ['cream', 'green'] }
const FA_FINISH: Record<string, string> = { cream: 'کرم', gray: 'خاکستری', green: 'سبز' }
const THRESHOLD = 140

const c = new pg.Client({ connectionString: process.env.DATABASE_URI })
await c.connect()
let fakeId = -1
const run = async (sql: string, p: unknown[] = []) => APPLY ? (await c.query(sql, p)).rows : []
const ins = async (sql: string, p: unknown[]) => { if (APPLY) return (await c.query(sql, p)).rows[0].id as number; return fakeId-- }

const PRODUCT_COPY = `INSERT INTO products
 (name, slug, tagline, short_description, long_description, design_id, piece_type, sku, base_price_rials, sale_price_rials, availability, lead_time_days, dimensions_width, dimensions_height, dimensions_depth, specs, inquiry_enabled, featured, featured_order, status, published_at, seo_meta_title, seo_meta_description, seo_og_image_id, seo_canonical_url, seo_noindex, warranty_years, after_sales_years, collection_tile_image_id, updated_at, created_at)
 SELECT $1,$2, tagline, short_description, long_description, design_id, piece_type, $3, $4, sale_price_rials, availability, lead_time_days, dimensions_width, dimensions_height, dimensions_depth, specs, inquiry_enabled, featured, featured_order, status, published_at, seo_meta_title, seo_meta_description, seo_og_image_id, seo_canonical_url, seo_noindex, warranty_years, after_sales_years, collection_tile_image_id, now(), now()
 FROM products WHERE id=$5 RETURNING id`

type SrcVar = { id: number; sku: string; label: string; delta: number; avail: string | null; img: number | null; axes: { key: string; value: string }[] }

async function loadVariants(bedId: number): Promise<SrcVar[]> {
  const vs = (await c.query(`SELECT id, sku, label, price_delta_rials AS delta, availability AS avail, image_id AS img, display_order FROM product_variants WHERE product_id=$1 ORDER BY display_order, id`, [bedId])).rows
  const out: SrcVar[] = []
  for (const v of vs) {
    const ax = (await c.query(`SELECT key, value FROM product_variants_axes WHERE _parent_id=$1 ORDER BY _order`, [v.id])).rows
    out.push({ id: v.id, sku: v.sku, label: v.label, delta: Number(v.delta) || 0, avail: v.avail, img: v.img, axes: ax })
  }
  return out
}
const sizeOf = (v: SrcVar) => { const a = v.axes.find((x) => x.key === 'size'); return a ? parseInt(a.value, 10) : 0 }
const faDigits = (s: string) => s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]) // Persian digits in UI labels

// Build the variant rows for a new bed from source variants, applying finish-fix expansion + delta rebase.
function buildVariants(src: SrcVar[], design: string, newSlug: string, deltaBase: number) {
  const fvs = FINISH[design]
  const rows: { sku: string; label: string; delta: number; avail: string | null; img: number | null; axes: { key: string; value: string }[] }[] = []
  for (const v of src) {
    const size = v.axes.find((x) => x.key === 'size')
    const hasFinish = v.axes.some((x) => x.key === 'finish')
    const delta = v.delta - deltaBase
    if (fvs && size && !hasFinish) {
      for (const fv of fvs) rows.push({
        sku: `${newSlug}-size-${size.value}-finish-${fv}`,
        label: `اندازه: ${faDigits(size.value)} · روکش: ${FA_FINISH[fv]}`,
        delta, avail: v.avail, img: v.img,
        axes: [{ key: 'size', value: size.value }, { key: 'finish', value: fv }],
      })
    } else {
      rows.push({ sku: v.sku.includes('-bed') ? v.sku.replace(/-bed(-|$)/, `-bed-${newSlug.endsWith('-double') ? 'double' : 'teen'}$1`) : `${newSlug}-${v.sku}`, label: v.label, delta, avail: v.avail, img: v.img, axes: v.axes })
    }
  }
  return rows
}

async function createBed(name: string, slug: string, sku: string, base: number, oldId: number, occ: string, vrows: ReturnType<typeof buildVariants>) {
  const id = await ins(PRODUCT_COPY, [name, slug, sku, base, oldId])
  if (APPLY) {
    await run(`INSERT INTO products_occupancies (parent_id,"order",value) VALUES ($1,0,$2)`, [id, occ])
    await run(`INSERT INTO products_rels ("order",parent_id,path,categories_id,tags_id,materials_id,media_id,products_id) SELECT "order",$1,path,categories_id,tags_id,materials_id,media_id,products_id FROM products_rels WHERE parent_id=$2`, [id, oldId])
    let ord = 0
    for (const r of vrows) {
      const vid = await ins(`INSERT INTO product_variants (product_id,sku,label,price_delta_rials,availability,image_id,display_order,updated_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now()) RETURNING id`, [id, r.sku, r.label, r.delta, r.avail, r.img, ord])
      let an = 0
      for (const a of r.axes) await run(`INSERT INTO product_variants_axes (_order,_parent_id,id,key,value) VALUES ($1,$2,$3,$4,$5)`, [an, vid, `${vid}-axis-${an}`, a.key, a.value], ), an++
      ord += 10
    }
  }
  return id
}

const log: string[] = []
try {
  await c.query('BEGIN')
  // (design,occ) -> series_occupancy id
  const soRows = (await c.query(`SELECT so.id, so.occupancy::text occ, d.slug design FROM series_occupancies so JOIN designs d ON so.design_id=d.id`)).rows
  const soId: Record<string, number> = {}; for (const r of soRows) soId[`${r.design}:${r.occ}`] = r.id

  for (const design of SPLITS) {
    const bed = (await c.query(`SELECT p.id, p.slug, p.sku, p.base_price_rials AS base, d.name AS fa FROM products p JOIN designs d ON p.design_id=d.id WHERE p.slug=$1`, [`${design}-bed`])).rows[0]
    const src = await loadVariants(bed.id)
    const teenSrc = src.filter((v) => sizeOf(v) < THRESHOLD)
    const dblSrc = src.filter((v) => sizeOf(v) >= THRESHOLD)
    const dblDelta = Math.min(...dblSrc.map((v) => v.delta))
    const teenSlug = `${bed.slug}-teen`, dblSlug = `${bed.slug}-double`
    const teenBase = Number(bed.base), dblBase = Number(bed.base) + dblDelta
    const teenV = buildVariants(teenSrc, design, teenSlug, 0)
    const dblV = buildVariants(dblSrc, design, dblSlug, dblDelta)

    log.push(`\n■ ${design}: split #${bed.id} (${bed.slug}, base ${bed.base})  → teen[${teenSrc.map(sizeOf)}] + double[${dblSrc.map(sizeOf)}] (jump ${dblDelta})`)
    log.push(`   create ${teenSlug}  «تخت نوجوان ${bed.fa}»  base ${teenBase}  occ teen  variants: ${teenV.map((v) => v.label).join(' | ')}`)
    log.push(`   create ${dblSlug}  «تخت دو نفره ${bed.fa}»  base ${dblBase}  occ double  variants: ${dblV.map((v) => v.label).join(' | ')}`)

    const teenId = await createBed(`تخت نوجوان ${bed.fa}`, teenSlug, `${bed.sku}-teen`, teenBase, bed.id, 'teen', teenV)
    const dblId = await createBed(`تخت دو نفره ${bed.fa}`, dblSlug, `${bed.sku}-double`, dblBase, bed.id, 'double', dblV)

    // repoint incoming product refs → both
    const inc = (await c.query(`SELECT id, parent_id, path FROM products_rels WHERE products_id=$1`, [bed.id])).rows
    log.push(`   repoint ${inc.length} incoming refs → both new beds`)
    if (APPLY) for (const r of inc) {
      const nx = (await c.query(`SELECT COALESCE(MAX("order"),-1)+1 n FROM products_rels WHERE parent_id=$1 AND path=$2`, [r.parent_id, r.path])).rows[0].n
      await run(`INSERT INTO products_rels ("order",parent_id,path,products_id) VALUES ($1,$2,$3,$4),($5,$2,$3,$6)`, [nx, r.parent_id, r.path, teenId, nx + 1, dblId])
      await run(`DELETE FROM products_rels WHERE id=$1`, [r.id])
    }
    // swap combos
    const combos = (await c.query(`SELECT r.id, so.occupancy::text occ FROM series_occupancies_rels r JOIN series_occupancies so ON so.id=r.parent_id WHERE r.products_id=$1 AND r.path='products'`, [bed.id])).rows
    log.push(`   combos: ${combos.map((x) => x.occ).join(',')} → teen⇒teen-bed, double⇒double-bed, baby⇒remove`)
    if (APPLY) for (const r of combos) {
      if (r.occ === 'teen') await run(`UPDATE series_occupancies_rels SET products_id=$1 WHERE id=$2`, [teenId, r.id])
      else if (r.occ === 'double') await run(`UPDATE series_occupancies_rels SET products_id=$1 WHERE id=$2`, [dblId, r.id])
      else await run(`DELETE FROM series_occupancies_rels WHERE id=$1`, [r.id])
    }
    // delete old bed
    log.push(`   delete old bed #${bed.id} (+${src.length} variants)`)
    if (APPLY) {
      await run(`DELETE FROM product_variants_axes WHERE _parent_id IN (SELECT id FROM product_variants WHERE product_id=$1)`, [bed.id])
      await run(`DELETE FROM product_variants WHERE product_id=$1`, [bed.id])
      await run(`DELETE FROM products_rels WHERE parent_id=$1`, [bed.id])
      await run(`DELETE FROM products_occupancies WHERE parent_id=$1`, [bed.id])
      await run(`DELETE FROM products WHERE id=$1`, [bed.id])
    }
  }

  // ── parla special: 506 trim to teen, 582 repair into parla-bed-double ──
  const p506 = (await c.query(`SELECT id, base_price_rials AS base FROM products WHERE slug='parla-bed'`)).rows[0]
  const p582 = (await c.query(`SELECT p.id FROM products p JOIN designs d ON p.design_id=d.id WHERE d.slug='parla' AND (p.slug IS NULL OR p.slug='') AND p.name LIKE 'تخت دو نفره%'`)).rows[0]
  const psrc = await loadVariants(p506.id)
  const pteen = psrc.filter((v) => sizeOf(v) < THRESHOLD), pdbl = psrc.filter((v) => sizeOf(v) >= THRESHOLD)
  const pjump = Math.min(...pdbl.map((v) => v.delta))
  log.push(`\n■ parla SPECIAL: 506 trim→teen[${pteen.map(sizeOf)}] (fix finish), 582 repair→parla-bed-double[${pdbl.map(sizeOf)}] base ${Number(p506.base) + pjump}`)
  const pteenV = buildVariants(pteen, 'parla', 'parla-bed', 0)            // expands bare 90→cream/green
  const pdblV = buildVariants(pdbl, 'parla', 'parla-bed-double', pjump)   // expands bare 140/180→cream/green
  log.push(`   506 teen variants → ${pteenV.map((v) => v.label).join(' | ')}`)
  log.push(`   582 double variants → ${pdblV.map((v) => v.label).join(' | ')}`)
  if (APPLY) {
    // 506: drop all variants, recreate teen set
    await run(`DELETE FROM product_variants_axes WHERE _parent_id IN (SELECT id FROM product_variants WHERE product_id=$1)`, [p506.id])
    await run(`DELETE FROM product_variants WHERE product_id=$1`, [p506.id])
    let ord = 0
    for (const r of pteenV) { const vid = await ins(`INSERT INTO product_variants (product_id,sku,label,price_delta_rials,availability,image_id,display_order,updated_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now()) RETURNING id`, [p506.id, r.sku, r.label, r.delta, r.avail, r.img, ord]); let an = 0; for (const a of r.axes) { await run(`INSERT INTO product_variants_axes (_order,_parent_id,id,key,value) VALUES ($1,$2,$3,$4,$5)`, [an, vid, `${vid}-axis-${an}`, a.key, a.value]); an++ } ord += 10 }
    // 582: become parla-bed-double
    await run(`UPDATE products SET slug='parla-bed-double', sku='parla-bed-double', base_price_rials=$1, status='published', updated_at=now() WHERE id=$2`, [Number(p506.base) + pjump, p582.id])
    await run(`INSERT INTO products_rels ("order",parent_id,path,categories_id,tags_id,materials_id,media_id,products_id) SELECT "order",$1,path,categories_id,tags_id,materials_id,media_id,products_id FROM products_rels WHERE parent_id=$2`, [p582.id, p506.id])
    ord = 0
    for (const r of pdblV) { const vid = await ins(`INSERT INTO product_variants (product_id,sku,label,price_delta_rials,availability,image_id,display_order,updated_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now()) RETURNING id`, [p582.id, r.sku, r.label, r.delta, r.avail, r.img, ord]); let an = 0; for (const a of r.axes) { await run(`INSERT INTO product_variants_axes (_order,_parent_id,id,key,value) VALUES ($1,$2,$3,$4,$5)`, [an, vid, `${vid}-axis-${an}`, a.key, a.value]); an++ } ord += 10 }
  }

  // ── loof / skate: retag bed teen (drop baby); loof bed out of baby combo ──
  for (const design of ['loof', 'skate']) {
    const b = (await c.query(`SELECT id FROM products WHERE slug=$1`, [`${design}-bed`])).rows[0]
    log.push(`\n■ ${design}: bed #${b.id} → occ teen (drop baby)${design === 'loof' ? '; remove from baby combo' : ''}`)
    if (APPLY) {
      await run(`DELETE FROM products_occupancies WHERE parent_id=$1`, [b.id])
      await run(`INSERT INTO products_occupancies (parent_id,"order",value) VALUES ($1,0,'teen')`, [b.id])
      if (soId[`${design}:baby`]) await run(`DELETE FROM series_occupancies_rels WHERE parent_id=$1 AND path='products' AND products_id=$2`, [soId[`${design}:baby`], b.id])
    }
  }

  console.log(log.join('\n'))
  if (APPLY) { await c.query('COMMIT'); console.log('\n✅ APPLIED.') }
  else { await c.query('ROLLBACK'); console.log('\n— DRY RUN (no changes). Re-run with --apply.') }
} catch (e) { await c.query('ROLLBACK'); console.error('ROLLED BACK:', e); process.exitCode = 1 }
finally { await c.end() }
