/**
 * Catalog audit batch — STAGE 2: occupancy convention (tags + combo membership).
 * Spec: docs/superpowers/specs/2026-06-26-catalog-design-audit-ledger.md
 * NON-bed pieces only — beds (splits, loof/skate retag, parla repair) are STAGE 3.
 *
 * Usage:
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-16-occupancy-convention.mts          # dry-run
 *   pnpm --filter @zhic/api exec tsx scripts/reconcile-16-occupancy-convention.mts --apply  # write
 *
 * Idempotent. Direct pg. Held designs excluded. Rules (clamped to each design's served
 * occupancies = the occupancies that have a combo; never orphan):
 *   vanity, vanity-chair, console/table-mirror → teen+double
 *   study-desk, study-chair, bookcase          → teen
 *   standing-mirror(+regal), loveseat          → double
 *   wall-shelf                                 → baby+teen
 *   bed-box, changing-top/table, display-cabinet, combined-wardrobe → baby
 *   convertible-*                              → baby (if design serves baby) else baby+teen, OUT of combos
 *   shared (wardrobe/file/nightstand/console/sliding-wardrobe/wall-mirror/bed-guard) → current tags ∩ served (clamp-drop only)
 * Combo membership synced to target ONLY for governed/baby-only/convertible types; shared & beds left as-is.
 */
import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const env = readFileSync(resolve(__dirname, '../.env'), 'utf8')
  for (const line of env.split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const i = t.indexOf('='); if (i > 0 && !process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
} catch { /* env from process */ }
const APPLY = process.argv.includes('--apply')

const HELD = new Set(['classic', 'eliza', 'roco', 'romantic', 'catherine', 'general', 'adrian'])
const GOVERNED: Record<string, string[]> = {
  'vanity': ['teen', 'double'], 'vanity-chair': ['teen', 'double'],
  'console-vanity-mirror': ['teen', 'double'], 'table-mirror': ['teen', 'double'],
  'study-desk': ['teen'], 'study-chair': ['teen'], 'bookcase': ['teen'],
  'standing-mirror': ['double'], 'standing-mirror-regal': ['double'], 'loveseat': ['double'],
  'wall-shelf': ['baby', 'teen'],
}
const BABY_ONLY = new Set(['bed-box', 'changing-top', 'changing-table', 'display-cabinet', 'combined-wardrobe'])
const CONVERTIBLE = new Set(['convertible-teen', 'convertible-sofa'])
const SKIP_BED = new Set(['bed', 'bunk-bed', 'baby-bed', '']) // beds → stage 3; '' = parla broken double
const inter = (a: string[], b: Set<string>) => a.filter((x) => b.has(x))
const eq = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join()

const client = new pg.Client({ connectionString: process.env.DATABASE_URI })
await client.connect()
try {
  await client.query('BEGIN')

  // design served occupancies + (design,occ)->series_occupancy id
  const so = (await client.query(`SELECT so.id, so.occupancy::text AS occ, d.slug AS design FROM series_occupancies so JOIN designs d ON so.design_id=d.id`)).rows
  const served: Record<string, Set<string>> = {}
  const soId: Record<string, number> = {} // `${design}:${occ}` -> id
  for (const r of so) { (served[r.design] ??= new Set()).add(r.occ); soId[`${r.design}:${r.occ}`] = r.id }

  // active non-bed products with current tags + design
  const prods = (await client.query(`
    SELECT p.id, p.slug, p.name, d.slug AS design,
           COALESCE(array_agg(po.value::text) FILTER (WHERE po.value IS NOT NULL), '{}') AS tags
    FROM products p JOIN designs d ON p.design_id=d.id
    LEFT JOIN products_occupancies po ON po.parent_id=p.id
    GROUP BY p.id, p.slug, p.name, d.slug`)).rows as { id: number; slug: string; name: string; design: string; tags: string[] }[]

  // current combo memberships: products_id -> Set of occ
  const relRows = (await client.query(`
    SELECT r.products_id AS pid, so.occupancy::text AS occ, so.id AS soid
    FROM series_occupancies_rels r JOIN series_occupancies so ON so.id=r.parent_id WHERE r.path='products'`)).rows
  const inCombo: Record<number, Set<string>> = {}
  for (const r of relRows) (inCombo[r.pid] ??= new Set()).add(r.occ)

  let tagChanges = 0, comboAdds = 0, comboRemoves = 0
  const tagLog: string[] = [], comboLog: string[] = []

  for (const p of prods) {
    if (HELD.has(p.design)) continue
    const tail = p.slug?.startsWith(p.design + '-') ? p.slug.slice(p.design.length + 1) : (p.slug ?? '')
    if (SKIP_BED.has(tail)) continue
    const sv = served[p.design] ?? new Set<string>()

    // target tags
    let targetTags: string[]
    let comboOccs: string[] | null // null = leave combos alone (shared/bed-guard)
    if (tail in GOVERNED) {
      targetTags = inter(GOVERNED[tail], sv)
      // never orphan: governed pieces are non-nursery furniture → fall back to the
      // design's non-baby occupancies (teen/double/bunk), only baby as a last resort.
      if (!targetTags.length) { targetTags = [...sv].filter((o) => o !== 'baby'); if (!targetTags.length) targetTags = [...sv] }
      comboOccs = targetTags
    }
    else if (BABY_ONLY.has(tail)) { targetTags = inter(['baby'], sv); if (!targetTags.length) targetTags = [...sv]; comboOccs = targetTags }
    else if (CONVERTIBLE.has(tail)) {
      targetTags = sv.has('baby') ? ['baby'] : ['baby', 'teen']
      comboOccs = sv.has('baby') ? ['baby'] : [] // out of combos when no baby set
    } else { targetTags = inter(p.tags, sv); comboOccs = null } // shared/bed-guard: clamp-drop only, leave combos

    // tag diff
    if (!eq(p.tags, targetTags)) {
      tagChanges++
      tagLog.push(`   tag  ${p.design.padEnd(11)} #${p.id} ${p.name}  [${[...p.tags].sort()}] → [${[...targetTags].sort()}]`)
      if (APPLY) {
        await client.query(`DELETE FROM products_occupancies WHERE parent_id=$1`, [p.id])
        let ord = 0
        for (const occ of targetTags) await client.query(`INSERT INTO products_occupancies (parent_id, "order", value) VALUES ($1,$2,$3)`, [p.id, ord++, occ])
      }
    }

    // combo sync (only for governed/baby-only/convertible)
    if (comboOccs !== null) {
      const cur = inCombo[p.id] ?? new Set<string>()
      const want = new Set(comboOccs.filter((o) => soId[`${p.design}:${o}`]))
      for (const o of want) if (!cur.has(o)) {
        comboAdds++; comboLog.push(`   +combo ${p.design}:${o} #${p.id} ${p.name}`)
        if (APPLY) { const sid = soId[`${p.design}:${o}`]; const nx = (await client.query(`SELECT COALESCE(MAX("order"),-1)+1 AS n FROM series_occupancies_rels WHERE parent_id=$1 AND path='products'`, [sid])).rows[0].n; await client.query(`INSERT INTO series_occupancies_rels (parent_id, path, "order", products_id) VALUES ($1,'products',$2,$3)`, [sid, nx, p.id]) }
      }
      for (const o of cur) if (!want.has(o)) {
        comboRemoves++; comboLog.push(`   -combo ${p.design}:${o} #${p.id} ${p.name}`)
        if (APPLY) { const sid = soId[`${p.design}:${o}`]; if (sid) await client.query(`DELETE FROM series_occupancies_rels WHERE parent_id=$1 AND path='products' AND products_id=$2`, [sid, p.id]) }
      }
    }
  }

  console.log(`\n=== TAG CHANGES (${tagChanges}) ===\n` + tagLog.join('\n'))
  console.log(`\n=== COMBO CHANGES (+${comboAdds} / -${comboRemoves}) ===\n` + comboLog.join('\n'))
  if (APPLY) { await client.query('COMMIT'); console.log('\n✅ APPLIED.') }
  else { await client.query('ROLLBACK'); console.log('\n— DRY RUN. Re-run with --apply to write.') }
} catch (e) { await client.query('ROLLBACK'); console.error('ROLLED BACK:', e); process.exitCode = 1 }
finally { await client.end() }
