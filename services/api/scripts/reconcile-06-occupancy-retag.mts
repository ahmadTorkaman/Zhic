/**
 * Reconcile Stage 6 — Product occupancy re-tag (4 scened designs)
 *
 * Problem B from docs/reports/url-list-vs-catalog-diff-2026-06-08.md §4b:
 * whole series are blanket-tagged (every product carries its design's full age
 * set). Occupancy is read from the per-age SET-SCENE image. Scenes exist for
 * only 4 designs (caroline, loof, lukaplus, parla — bedroom-set-{d}-{age}-card.webp),
 * so only these can be re-tagged now; the other 22 are blocked on the 3D artist.
 *
 * Method: a product's occupancies = the ages whose existing set-scene it appears
 * in. caroline/loof/lukaplus have a scene for BOTH their declared ages, so every
 * product is fully adjudicable. parla is missing its `double` scene, so for parla
 * we only apply the high-confidence calls (bunk-bed isolation, study=teen,
 * changing/guard=baby) and otherwise just strip the bogus `bunk` tag — `double`
 * is left intact because there's no scene to disprove it.
 *
 * Target map below is explicit per slug (audited against the 9 scenes). Any
 * product not listed AND not a parla item is left untouched. parla items not
 * listed have `bunk` stripped (only the bunk bed belongs to the bunk scene).
 *
 * Run:  cd services/api && DRY=1 tsx scripts/reconcile-06-occupancy-retag.mts   # preview
 *       cd services/api &&        tsx scripts/reconcile-06-occupancy-retag.mts   # apply
 */
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const payloadEntry = require.resolve('payload')
const payloadDir = dirname(payloadEntry).replace(/\/dist$/, '')
const payloadUrl = pathToFileURL(`${payloadDir}/dist/index.js`).href

const DRY = !!process.env.DRY
type Age = 'baby' | 'teen' | 'double' | 'bunk'

// Explicit target occupancies per product slug, audited from the set scenes.
// caroline scenes: double, teen   | loof scenes: baby, teen
// lukaplus scenes: double, teen   | parla scenes: baby, bunk, teen (no double)
const TARGET: Record<string, Age[]> = {
  // ── caroline (vanity/mirror group → double; study/bookcase → teen) ──
  'caroline-bookcase': ['teen'],
  'caroline-changing-top': ['baby'],
  'caroline-console-vanity-mirror': ['double'],
  'caroline-vanity': ['double'],
  'caroline-vanity-chair': ['double'],
  'caroline-standing-mirror': ['double'],
  'caroline-study-desk': ['teen'],
  'caroline-study-chair': ['teen'],
  // ── loof (vanity/mirror group → teen; changing/guard/display → baby) ──
  'loof-bookcase': ['teen'],
  'loof-changing-table': ['baby'],
  'loof-changing-top': ['baby'],
  'loof-bed-guard': ['baby'],
  'loof-display-cabinet': ['baby'],
  'loof-study-desk': ['teen'],
  'loof-study-chair': ['teen'],
  'loof-standing-mirror': ['teen'],
  'loof-console-vanity-mirror': ['teen'],
  'loof-vanity': ['teen'],
  'loof-vanity-chair': ['teen'],
  // ── lukaplus (vanity/mirror group → double; study/bookcase → teen) ──
  'lukaplus-bookcase': ['teen'],
  'lukaplus-study-desk': ['teen'],
  'lukaplus-study-chair': ['teen'],
  'lukaplus-vanity': ['double'],
  'lukaplus-console-vanity-mirror': ['double'],
  'lukaplus-standing-mirror': ['double'],
  'lukaplus-vanity-chair': ['double'],
  // ── parla (high-confidence only; see header) ──
  'parla-bunk-bed': ['bunk'],
  'parla-study-desk': ['teen'],
  'parla-study-chair': ['teen'],
  'parla-changing-table': ['baby'],
  'parla-bed-guard': ['baby'],
}

const DESIGNS = ['caroline', 'loof', 'lukaplus', 'parla']
const norm = (a: Age[]) => [...new Set(a)].sort().join(',')

const { getPayload } = await import(payloadUrl)
const config = (await import('../src/payload.config.ts')).default
const payload = await getPayload({ config })

let changes = 0
const log = (msg: string) => console.log(`${DRY ? '[dry] ' : ''}${msg}`)

for (const slug of DESIGNS) {
  const res = await payload.find({
    collection: 'products',
    where: { 'design.slug': { equals: slug } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  for (const p of res.docs) {
    const cur = ((p.occupancies ?? []) as Age[])
    let next: Age[]
    if (p.slug in TARGET) {
      next = TARGET[p.slug]
    } else if (slug === 'parla') {
      // parla fallback: strip the bogus bunk tag, keep the rest
      next = cur.filter((a) => a !== 'bunk')
    } else {
      continue // fully-scened designs: untouched products are already correct
    }
    if (norm(cur) === norm(next)) continue
    log(`product #${p.id} ${p.slug}: [${cur.join(',')}] → [${next.join(',')}]`)
    changes++
    if (!DRY) {
      await payload.update({
        collection: 'products',
        id: p.id,
        data: { occupancies: next },
        overrideAccess: true,
      })
    }
  }
}

log(`${DRY ? 'WOULD change' : 'changed'} ${changes} product(s).`)
process.exit(0)
