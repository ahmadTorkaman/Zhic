# Designs Index Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `/designs` index page — a single-focus carousel showing 3 designs at a time (dim sides without chrome, center with card chrome + 22% right-edge GIF spill), manual nav (arrows + swipe + keyboard + dots), infinite-loop wrap via clone tiles. Closes `FU-MM-a` and `FU-DDP-d`.

**Architecture:** Designs collection gets one new `sliderMedia` upload field (migration adds the column + FK). `apps/web` adds one route, one client component (DesignsSlider) with scoped CSS, and small helpers (TileMedia, TilePlaceholder) co-located in the component file. Mega-menu and mobile menu get the «همه‌ی طرح‌ها →» CTA restored (was cut when the route didn't yet exist). Sitemap gets the static `/designs` entry. Visual reference: `apps/web/public/docs/designs-index-mockup.html`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind v4, Payload 3, Postgres. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`
**Closes:** `FU-MM-a`, `FU-DDP-d`

---

## File structure

### Files created

| Path | Responsibility |
|---|---|
| `apps/web/src/app/(site)/designs/page.tsx` | The route. Server component, fetches all designs, renders the page chrome + the slider client component. |
| `apps/web/src/components/design/DesignsSlider.tsx` | Client component. Slider state, navigation (arrows / dots / swipe / keyboard), clone-tile wrap, caption cross-fade, ARIA. Includes inline helpers `TileMedia` and `TilePlaceholder` (≤30 lines each — not worth their own files). |
| `apps/web/src/components/design/designs-slider.css` | Component-scoped CSS. Tile chrome differentiation (dim = naked, focused = card + right-spill), arrow styling, dot/counter, mobile-proportional sizing via `clamp()`. |
| `services/api/src/migrations/20260517_<HHMMSS>_add_design_slider_media.ts` | Hand-written migration adding `slider_media_id` integer FK on `designs`. (Generation tooling is broken — FU-7.1-c.) |

### Files modified

| Path | Change |
|---|---|
| `services/api/src/collections/Designs.ts` | Add `sliderMedia` upload field after `heroMedia`. |
| `services/api/src/migrations/index.ts` | Register the new migration. |
| `apps/web/src/lib/payload.ts` | Extend `PayloadDesign` with `sliderMedia?: PayloadMedia | null`. Restore `fetchAllDesigns()` (was removed earlier when sitemap got its own helper). |
| `apps/web/src/components/layout/ProductsMegaMenu.tsx` | DesignsPanel gets a «همه‌ی طرح‌ها →» CTA at the bottom pointing at `/designs`. |
| `apps/web/src/components/layout/MobileMenu.tsx` | DesignsSection gets a «← همه‌ی طرح‌ها» link below the grid pointing at `/designs`. |
| `apps/web/src/app/sitemap.ts` | Add the static `/designs` entry (priority 0.8, weekly). |
| `docs/state.md` | Strike-through `FU-MM-a` + `FU-DDP-d`, append `FU-DIX-*` follow-ups, add Post-Phase row. |

---

## Notes for the implementer

- **Migration tooling is broken** (FU-7.1-c — confirmed on this branch multiple times). `pnpm migrate:create` fails on the `@next/env` `loadEnvConfig` destructure on Node 24. Use the established workaround from prior migrations on this branch: hand-write the migration .ts file following the exact shape of `20260516_224611_add_design_editorial_fields.ts`, apply via direct pg client, register in `services/api/src/migrations/index.ts`, insert a row into `payload_migrations` table.
- **Workspace DB connection**: `postgresql://zhic:zhic_staging_pw_2026@127.0.0.1:5433/zhic`. The api runs against this in pm2 (`zhic-api`).
- **pm2 restart**: After Designs schema changes, restart `pm2 restart zhic-api` so Payload picks up the new field set. After web changes, `pm2 restart zhic-web` (the workspace runs `next start`, not `next dev`).
- **Visual reference**: `apps/web/public/docs/designs-index-mockup.html` shows the chrome + spill exactly. The component should match it.
- **No `@testing-library/react`** in the project — manual smoke + typecheck + build are the verification path. Don't add the dependency.
- **Mobile layout**: same 3-visible model as desktop, no reflow. Inherits chrome rules unchanged. Only the absolute sizing scales down via `clamp()`.

---

## Task 1: Branch baseline

**Files:** None modified.

- [ ] **Step 1: Confirm branch + clean tree**

```bash
git -C /home/ahmad/Zhic branch --show-current
git -C /home/ahmad/Zhic status --short
git -C /home/ahmad/Zhic log --oneline -3
```

Expected:
- Branch: `feat/products-mega-menu`
- Status: clean
- Top commit: `f531450 docs(spec): /designs index — chrome differentiation + right-edge GIF spill` (or later if the user added anything)

If not on `feat/products-mega-menu`, run `git checkout feat/products-mega-menu`.

- [ ] **Step 2: Baseline tests + typechecks + pm2**

```bash
pnpm --filter @zhic/web test
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/api typecheck
pm2 list | grep -E "zhic-(web|api)"
```

Expected: tests pass, both typechecks clean, both pm2 processes `online`.

- [ ] **Step 3: No commit.** Verification only.

---

## Task 2: Extend Designs schema + migration

**Files:**
- Modify: `services/api/src/collections/Designs.ts`
- Create: `services/api/src/migrations/20260517_<HHMMSS>_add_design_slider_media.ts`
- Modify: `services/api/src/migrations/index.ts`

- [ ] **Step 1: Extend the Designs collection**

In `/home/ahmad/Zhic/services/api/src/collections/Designs.ts`, find the existing `heroMedia` field. Insert the new `sliderMedia` field IMMEDIATELY AFTER `heroMedia` (logical grouping — both are single-media uploads):

```ts
    {
      name: 'sliderMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر اسلایدر صفحه‌ی طرح‌ها',
      admin: {
        description: 'مدیای کارت این طرح در اسلایدر صفحه‌ی /designs (ترجیحاً GIF یا ویدیوی کوتاه که کل ست را نشان می‌دهد). اگر خالی باشد، از heroMedia یا گالری استفاده می‌شود.',
      },
    },
```

- [ ] **Step 2: Verify api typecheck clean**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Hand-write the migration file**

Generate a timestamp filename: `20260517_<HHMMSS>_add_design_slider_media.ts` — use the current time (e.g., `20260517_140000` if applying at 14:00:00 UTC; the implementer fills the actual HHMMSS).

Create `/home/ahmad/Zhic/services/api/src/migrations/20260517_<HHMMSS>_add_design_slider_media.ts` with this exact content:

```ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add slider_media_id column + FK on designs.
 * Mirrors the heroMedia FK shape from the earlier editorial-fields migration.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "slider_media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "designs"
        ADD CONSTRAINT "designs_slider_media_id_media_id_fk"
        FOREIGN KEY ("slider_media_id")
        REFERENCES "media"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "designs"
      DROP CONSTRAINT IF EXISTS "designs_slider_media_id_media_id_fk",
      DROP COLUMN IF EXISTS "slider_media_id";
  `)
}
```

- [ ] **Step 4: Apply the migration via direct pg + register it**

The migrate runner can't load this from CLI (FU-7.1-c). Apply the SQL directly and add a row to `payload_migrations` so Payload knows it's applied.

```bash
cd /tmp && cat > apply-slider-migration.mjs <<'EOF'
import pg from 'pg';
const c = new pg.Client({ connectionString: 'postgresql://zhic:zhic_staging_pw_2026@127.0.0.1:5433/zhic' });
await c.connect();
// Apply DDL
await c.query(`
  ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "slider_media_id" integer;
  DO $$ BEGIN
    ALTER TABLE "designs"
      ADD CONSTRAINT "designs_slider_media_id_media_id_fk"
      FOREIGN KEY ("slider_media_id")
      REFERENCES "media"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
`);
// Register in payload_migrations registry
const existing = await c.query(`SELECT batch FROM payload_migrations ORDER BY id`);
const nextBatch = Math.max(0, ...existing.rows.map(r => Number(r.batch) || 0)) + 1;
const MIGRATION_NAME = '20260517_<HHMMSS>_add_design_slider_media';  // ← REPLACE with the actual filename (no .ts extension)
await c.query(
  `INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ($1, $2, NOW(), NOW())`,
  [MIGRATION_NAME, nextBatch],
);
console.log('migration applied + registered as', MIGRATION_NAME, 'batch', nextBatch);
await c.end();
EOF
# IMPORTANT: edit /tmp/apply-slider-migration.mjs and replace <HHMMSS> on the MIGRATION_NAME line
# to match the actual file timestamp you used in Step 3.
node /tmp/apply-slider-migration.mjs
```

Expected output: `migration applied + registered as 20260517_<HHMMSS>_add_design_slider_media batch N`.

- [ ] **Step 5: Verify the column exists**

```bash
cat > /tmp/verify-slider.mjs <<'EOF'
import pg from 'pg';
const c = new pg.Client({ connectionString: 'postgresql://zhic:zhic_staging_pw_2026@127.0.0.1:5433/zhic' });
await c.connect();
const r = await c.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'designs' AND column_name = 'slider_media_id'
`);
console.log('slider_media_id:', r.rows[0] ?? 'MISSING');
await c.end();
EOF
node /tmp/verify-slider.mjs
```

Expected: `slider_media_id: { column_name: 'slider_media_id', data_type: 'integer', is_nullable: 'YES' }`.

- [ ] **Step 6: Register the migration in `services/api/src/migrations/index.ts`**

In `/home/ahmad/Zhic/services/api/src/migrations/index.ts`, find the existing imports + array entries. Add a new import line and a new array entry at the bottom (after the `20260517_023800_extend_piece_type_enum` entry).

Add to imports:

```ts
import * as migration_20260517_<HHMMSS>_add_design_slider_media from './20260517_<HHMMSS>_add_design_slider_media';
```

Add to the `migrations` array (after the last entry):

```ts
  {
    up: migration_20260517_<HHMMSS>_add_design_slider_media.up,
    down: migration_20260517_<HHMMSS>_add_design_slider_media.down,
    name: '20260517_<HHMMSS>_add_design_slider_media'
  },
```

Replace `<HHMMSS>` with the actual timestamp from Step 3.

- [ ] **Step 7: Restart api so Payload picks up the new field**

```bash
pm2 restart zhic-api
until curl -sf -o /dev/null http://localhost:3001/admin; do sleep 0.5; done
```

Verify the field is live via the API:

```bash
curl -s "http://localhost:3001/api/designs?limit=1" | python3 -c "import json,sys;d=json.load(sys.stdin); print('keys:', sorted(d['docs'][0].keys()) if d['docs'] else 'no docs')"
```

Expected: the output includes `sliderMedia` in the key list.

- [ ] **Step 8: Verify api typecheck still clean**

```bash
pnpm --filter @zhic/api typecheck
```

Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git -C /home/ahmad/Zhic add services/api/src/collections/Designs.ts services/api/src/migrations/
git -C /home/ahmad/Zhic commit -m "feat(api/designs): add sliderMedia field for /designs index slider tiles"
```

---

## Task 3: Extend `PayloadDesign` + restore `fetchAllDesigns`

**Files:**
- Modify: `apps/web/src/lib/payload.ts`

- [ ] **Step 1: Extend the `PayloadDesign` type**

In `/home/ahmad/Zhic/apps/web/src/lib/payload.ts`, find the existing `PayloadDesign` type. Replace it with this extended version (adds `sliderMedia` as an optional nullable `PayloadMedia`):

```ts
export type PayloadDesign = {
  id: string | number;
  name: string;
  slug: string;
  age_group?: 'infant' | 'child' | 'teen' | 'adult' | null;
  description?: LexicalRoot | null;
  gallery?: PayloadMedia[] | null;
  featured?: boolean | null;
  basePriceRials?: number | null;
  /** Short lead sentence shown under the design name on /designs/<slug>. */
  tagline?: string | null;
  /** Hero image for /designs/<slug>. Falls back to gallery[0] if null. */
  heroMedia?: PayloadMedia | null;
  /** Long-form editorial story with embedded media blocks. */
  storyBlocks?: LexicalRoot | null;
  /** Slider tile media on /designs (ideally a GIF). Falls back to heroMedia / gallery[0]. */
  sliderMedia?: PayloadMedia | null;
};
```

- [ ] **Step 2: Add `fetchAllDesigns` helper**

In the same file, find `fetchDesign` (it should be around line 580-600). Add `fetchAllDesigns` immediately after it:

```ts
export async function fetchAllDesigns(): Promise<PayloadDesign[]> {
  const res = await payloadFetch<PayloadList<PayloadDesign>>(
    '/api/designs?limit=100&sort=name&depth=2',
    'designs',
  );
  return res?.docs ?? [];
}
```

`depth=2` so `sliderMedia`, `heroMedia`, and `gallery` resolve to populated `PayloadMedia` objects (not just IDs).

- [ ] **Step 3: Verify typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Smoke the new fetcher via the running api**

```bash
curl -s "http://localhost:3001/api/designs?limit=2&sort=name&depth=2" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for design in d['docs']:
    sm = design.get('sliderMedia')
    print(f\"  {design['slug']:20} name={design['name']:15} sliderMedia={(sm and sm.get('url')) or 'null'}\")
"
```

Expected: 2 designs listed; `sliderMedia` is `null` for both (no media populated yet — operator uploads via admin). The shape confirms the new field reaches the API.

- [ ] **Step 5: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/lib/payload.ts
git -C /home/ahmad/Zhic commit -m "feat(web/payload): PayloadDesign.sliderMedia + restore fetchAllDesigns for /designs index"
```

---

## Task 4: Build `DesignsSlider` component + scoped CSS

**Files:**
- Create: `apps/web/src/components/design/DesignsSlider.tsx`
- Create: `apps/web/src/components/design/designs-slider.css`

This is the largest task in the plan. The component is ~280 lines; the CSS is ~180 lines. Both files are new — no merging concerns. Use the provided code verbatim.

- [ ] **Step 1: Create the CSS**

Create `/home/ahmad/Zhic/apps/web/src/components/design/designs-slider.css`:

```css
/* Designs slider — see docs/superpowers/specs/2026-05-17-designs-index-page-design.md §5.8 */

.zh-slider-section {
  position: relative;
  padding-block: 24px 16px;
  user-select: none;
}

.zh-slider-viewport {
  position: relative;
  overflow: hidden;
  margin-inline: clamp(36px, 8vw, 100px);
}

.zh-slider-track {
  display: flex;
  gap: clamp(12px, 2.5vw, 32px);
  transition: transform var(--dur-mega) var(--ease-out-soft);
  will-change: transform;
}

/* Default = dim tile: no chrome, just the naked media surface */
.zh-slider-tile {
  flex: 0 0 calc((100% - 2 * clamp(12px, 2.5vw, 32px)) / 3);
  aspect-ratio: 4 / 3;
  position: relative;
  cursor: pointer;
  opacity: 0.4;
  background: transparent;
  border: 0;
  border-radius: 0;
  overflow: visible;
  transition: opacity var(--dur-mega) var(--ease-out-soft);
}

/* The GIF surface lives on a child div so its size/shape can change
   independently of the tile box (which carries the card chrome when focused). */
.zh-tile-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  background: linear-gradient(135deg, var(--color-cream), var(--color-sand));
  transition: inset var(--dur-mega) var(--ease-out-soft),
              border-radius var(--dur-mega) var(--ease-out-soft);
}

.zh-tile-bg :is(img, video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Watermark placeholder when no media is uploaded */
.zh-tile-watermark {
  position: absolute;
  inset-inline-end: 8%;
  inset-block-end: 8%;
  font-size: clamp(60px, 10vw, 140px);
  line-height: 1;
  color: var(--color-ivory);
  opacity: 0.7;
  font-weight: 900;
  pointer-events: none;
}

/* Eyebrow + name overlays (visible on all tiles for identification) */
.zh-tile-eyebrow {
  position: absolute;
  inset-inline-start: 20px;
  inset-block-start: 18px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow-wide, 0.12em);
  color: var(--color-forest);
  font-weight: 700;
  z-index: 1;
}

.zh-tile-name {
  position: absolute;
  inset-inline-start: 20px;
  inset-block-end: 18px;
  font-size: clamp(16px, 1.8vw, 22px);
  font-weight: 900;
  color: var(--color-charcoal);
  z-index: 1;
}

/* Focused tile: gain chrome + right-spill */
.zh-slider-tile[data-focused] {
  opacity: 1;
  z-index: 5;
  border: 1px solid var(--color-sand);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(20, 17, 15, 0.10);
}

.zh-slider-tile[data-focused] .zh-tile-bg {
  right: -22%;
  border-radius: 8px 0 0 8px;
}

/* Slider arrows */
.zh-slider-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: clamp(40px, 5vw, 56px);
  height: clamp(40px, 5vw, 56px);
  border-radius: 50%;
  background: var(--color-ivory);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 14px rgba(20, 17, 15, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color var(--dur-hover) var(--ease-out-soft),
              border-color var(--dur-hover) var(--ease-out-soft),
              box-shadow var(--dur-hover);
  z-index: 10;
  color: var(--color-charcoal);
}

.zh-slider-arrow:hover {
  background: var(--color-cream);
  border-color: var(--color-stone);
  box-shadow: 0 6px 18px rgba(20, 17, 15, 0.12);
}

.zh-slider-arrow.zh-prev { right: clamp(4px, 1.5vw, 16px); }
.zh-slider-arrow.zh-next { left:  clamp(4px, 1.5vw, 16px); }
.zh-slider-arrow svg { width: 50%; height: 50%; }

/* Caption */
.zh-slider-caption {
  text-align: center;
  padding-block: 32px 20px;
  min-height: 110px;
}

.zh-caption-name {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1.15;
  margin-bottom: 8px;
  transition: opacity var(--dur-mega) var(--ease-out-soft);
}

.zh-caption-tagline {
  font-size: clamp(14px, 1.3vw, 17px);
  color: var(--color-stone);
  font-weight: 300;
  line-height: 1.6;
  transition: opacity var(--dur-mega) var(--ease-out-soft);
}

.zh-slider-caption[data-changing] .zh-caption-name,
.zh-slider-caption[data-changing] .zh-caption-tagline {
  opacity: 0.3;
}

/* Indicator (dots + counter) */
.zh-slider-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-block: 16px 32px;
}

.zh-slider-dots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 480px;
  justify-content: center;
}

.zh-slider-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-sand);
  cursor: pointer;
  border: 0;
  padding: 0;
  transition: background-color var(--dur-hover) var(--ease-out-soft),
              transform var(--dur-hover) var(--ease-out-soft);
}

.zh-slider-dot:hover { background: var(--color-stone); }

.zh-slider-dot[aria-selected="true"] {
  background: var(--color-charcoal);
  transform: scale(1.5);
}

.zh-slider-counter {
  font-size: 12px;
  color: var(--color-stone);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

/* Empty / 1-design / 2-design fallback layouts */
.zh-slider-empty {
  text-align: center;
  padding-block: 80px;
  color: var(--color-stone);
  font-size: clamp(15px, 1.4vw, 18px);
}

@media (prefers-reduced-motion: reduce) {
  .zh-slider-track,
  .zh-slider-tile,
  .zh-tile-bg,
  .zh-caption-name,
  .zh-caption-tagline { transition: none; }
}
```

- [ ] **Step 2: Create the component**

Create `/home/ahmad/Zhic/apps/web/src/components/design/DesignsSlider.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { PayloadDesign, PayloadMedia } from '@/lib/payload';
import './designs-slider.css';

export type DesignsSliderProps = {
  designs: PayloadDesign[];
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toPersianDigits = (n: number) =>
  String(n).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);

const SWIPE_THRESHOLD_PX = 40;
const CAPTION_FADE_MS = 200;

export function DesignsSlider({ designs }: DesignsSliderProps) {
  // ── Empty / sparse fallbacks ────────────────────────────────────────────
  if (designs.length === 0) {
    return (
      <section className="zh-slider-section">
        <p className="zh-slider-empty">به‌زودی طرح‌های ژیک به این صفحه اضافه می‌شوند.</p>
      </section>
    );
  }
  if (designs.length === 1) {
    return <SingleDesignFallback design={designs[0]!} />;
  }
  // ≥ 2 designs use the full slider

  return <Slider designs={designs} />;
}

// ─────────────────────────── Single-design fallback ───────────────────────

function SingleDesignFallback({ design }: { design: PayloadDesign }) {
  return (
    <section className="zh-slider-section" aria-label="گالری طرح‌ها">
      <div className="zh-slider-viewport" style={{ marginInline: 'clamp(36px, 8vw, 100px)' }}>
        <div className="zh-slider-track">
          <DesignTile design={design} isFocused />
        </div>
      </div>
      <div className="zh-slider-caption">
        <div className="zh-caption-name">{design.name}</div>
        {design.tagline ? <div className="zh-caption-tagline">{design.tagline}</div> : null}
      </div>
    </section>
  );
}

// ─────────────────────────── Main slider ─────────────────────────────────

function Slider({ designs }: { designs: PayloadDesign[] }) {
  const [focused, setFocused] = useState(0);
  const [captionChanging, setCaptionChanging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Center the focused tile in the viewport by transforming the track.
  // In RTL flex, positive translateX moves the track right, revealing items further along.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || track.children.length === 0) return;
    const firstTile = track.children[0] as HTMLElement;
    const secondTile = track.children[1] as HTMLElement | undefined;
    const tileWidth = firstTile.getBoundingClientRect().width;
    const gap = secondTile
      ? Math.abs(secondTile.offsetLeft - firstTile.offsetLeft) - tileWidth
      : 0;
    const slot = tileWidth + gap;
    const shift = (focused - 1) * slot;
    track.style.transform = `translateX(${shift}px)`;
  }, [focused, designs.length]);

  // Cross-fade the caption when focused changes
  useEffect(() => {
    setCaptionChanging(true);
    const t = setTimeout(() => setCaptionChanging(false), CAPTION_FADE_MS);
    return () => clearTimeout(t);
  }, [focused]);

  const go = useCallback(
    (delta: number) => {
      setFocused((prev) => (prev + delta + designs.length) % designs.length);
    },
    [designs.length],
  );

  // Keyboard arrow keys (RTL: ArrowLeft = next, ArrowRight = prev)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowLeft') go(+1);
      else if (e.key === 'ArrowRight') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go]);

  // Touch swipe
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.changedTouches[0]?.clientX ?? 0;
    };
    const onEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const dx = endX - startX;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      // RTL: swipe LEFT (negative dx) = next; swipe RIGHT (positive dx) = prev
      go(dx < 0 ? +1 : -1);
    };
    vp.addEventListener('touchstart', onStart, { passive: true });
    vp.addEventListener('touchend', onEnd);
    return () => {
      vp.removeEventListener('touchstart', onStart);
      vp.removeEventListener('touchend', onEnd);
    };
  }, [go]);

  const focusedDesign = designs[focused]!;

  return (
    <section className="zh-slider-section" aria-roledescription="carousel" aria-label="گالری طرح‌ها">
      <button
        type="button"
        className="zh-slider-arrow zh-prev"
        aria-label="طرح قبلی"
        onClick={() => go(-1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 6L15 12L9 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className="zh-slider-arrow zh-next"
        aria-label="طرح بعدی"
        onClick={() => go(+1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M15 6L9 12L15 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div ref={viewportRef} className="zh-slider-viewport">
        <div ref={trackRef} className="zh-slider-track" role="list">
          {designs.map((d, i) => (
            <DesignTile
              key={d.id}
              design={d}
              isFocused={i === focused}
              onClick={() => {
                if (i === focused) return; // center click handled by inner <Link>
                setFocused(i);
              }}
            />
          ))}
        </div>
      </div>

      <div className="zh-slider-caption" data-changing={captionChanging || undefined} aria-live="polite">
        <div className="zh-caption-name">{focusedDesign.name}</div>
        {focusedDesign.tagline ? (
          <div className="zh-caption-tagline">{focusedDesign.tagline}</div>
        ) : null}
      </div>

      <div className="zh-slider-indicator">
        <div className="zh-slider-dots" role="tablist" aria-label="گزینش طرح">
          {designs.map((d, i) => (
            <button
              key={d.id}
              type="button"
              className="zh-slider-dot"
              role="tab"
              aria-selected={i === focused}
              aria-label={`طرح ${d.name}`}
              onClick={() => setFocused(i)}
            />
          ))}
        </div>
        <div className="zh-slider-counter" role="status">
          {toPersianDigits(focused + 1)} از {toPersianDigits(designs.length)}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── Tile + helpers ──────────────────────────────

function DesignTile({
  design,
  isFocused,
  onClick,
}: {
  design: PayloadDesign;
  isFocused: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="zh-tile-bg">
        <TileMedia design={design} />
      </div>
      <span className="zh-tile-eyebrow">طرح</span>
      <span className="zh-tile-name">{design.name}</span>
    </>
  );

  // Focused tile is a Link (click navigates). Dim tile is a button (click selects).
  if (isFocused) {
    return (
      <Link
        href={`/designs/${encodeURIComponent(design.slug)}`}
        className="zh-slider-tile"
        data-focused
        role="listitem"
        aria-label={`طرح ${design.name} (انتخاب‌شده، رفتن به صفحه‌ی طرح)`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div
      className="zh-slider-tile"
      role="listitem"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`طرح ${design.name} (انتخاب کنید برای دیدن)`}
    >
      {inner}
    </div>
  );
}

function TileMedia({ design }: { design: PayloadDesign }) {
  const media: PayloadMedia | null =
    design.sliderMedia ?? design.heroMedia ?? design.gallery?.[0] ?? null;
  if (!media?.url) return <TilePlaceholder />;
  if (media.mimeType?.startsWith('video/')) {
    return (
      <video src={media.url} autoPlay loop muted playsInline preload="metadata" />
    );
  }
  // image/* including image/gif — GIFs animate naturally in <img>
  return <img src={media.url} alt="" />;
}

function TilePlaceholder() {
  return <span className="zh-tile-watermark" aria-hidden>ژ</span>;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/components/design/
git -C /home/ahmad/Zhic commit -m "feat(web/design): DesignsSlider component + scoped CSS for /designs index"
```

---

## Task 5: Build `/designs` route

**Files:**
- Create: `apps/web/src/app/(site)/designs/page.tsx`

The directory `apps/web/src/app/(site)/designs/` already exists (created earlier for `[slug]/page.tsx`). Just add the `page.tsx` index file.

- [ ] **Step 1: Create the route**

Create `/home/ahmad/Zhic/apps/web/src/app/(site)/designs/page.tsx`:

```tsx
import { Container, Breadcrumbs } from '@zhic/ui';
import { DesignsSlider } from '@/components/design/DesignsSlider';
import { fetchAllDesigns } from '@/lib/payload';

export const metadata = {
  title: 'طرح‌ها',
  description: 'گالری طرح‌های ژیک — هر طرح یک زبان طراحی برای فضای زندگی شما.',
  alternates: { canonical: '/designs' },
};

export default async function DesignsIndexPage() {
  const designs = await fetchAllDesigns();
  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'طرح‌ها' }]} />
        </div>
        <header className="py-9 text-center">
          <h1 className="text-h1 font-black text-ink">طرح‌ها</h1>
          <p className="mx-auto mt-3 max-w-[560px] text-lead font-light text-stone">
            هر طرح یک زبان طراحی است. کارت‌ها را کنار بزنید تا کل مجموعه را ببینید.
          </p>
        </header>
      </Container>

      <DesignsSlider designs={designs} />
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck + build**

```bash
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web build
```

Expected: 0 errors. Build succeeds; `/designs` appears in the route table as `ƒ (Dynamic)`.

- [ ] **Step 3: Commit**

```bash
git -C /home/ahmad/Zhic add "apps/web/src/app/(site)/designs/page.tsx"
git -C /home/ahmad/Zhic commit -m "feat(web/designs): /designs index page (slider lookbook)"
```

---

## Task 6: Restore «See all designs» CTAs on mega-menu + mobile menu

**Files:**
- Modify: `apps/web/src/components/layout/ProductsMegaMenu.tsx`
- Modify: `apps/web/src/components/layout/MobileMenu.tsx`

- [ ] **Step 1: Add CTA to ProductsMegaMenu DesignsPanel**

In `/home/ahmad/Zhic/apps/web/src/components/layout/ProductsMegaMenu.tsx`, find the `DesignsPanel` function. It currently looks like:

```tsx
function DesignsPanel({ items }: { items: NavMeta['designs'] }) {
  return (
    <div className="zh-mega-panel" data-panel="designs" role="tabpanel" id="panel-designs" aria-labelledby="tab-designs">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ طرحی پیدا نشد.</p>
      ) : (
        <ul className="zh-mega-grid">
          {items.map((d) => (
            <li key={d.id}>
              <Link href={`/designs/${encodeURIComponent(d.slug)}`}>
                <span>{d.name}</span>
                <span className="zh-count">{toPersianDigits(d.productCount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Replace the entire function with this version (adds the CTA after the `</ul>`):

```tsx
function DesignsPanel({ items }: { items: NavMeta['designs'] }) {
  return (
    <div className="zh-mega-panel" data-panel="designs" role="tabpanel" id="panel-designs" aria-labelledby="tab-designs">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ طرحی پیدا نشد.</p>
      ) : (
        <>
          <ul className="zh-mega-grid">
            {items.map((d) => (
              <li key={d.id}>
                <Link href={`/designs/${encodeURIComponent(d.slug)}`}>
                  <span>{d.name}</span>
                  <span className="zh-count">{toPersianDigits(d.productCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/designs" className="zh-mega-cta">
            همه‌ی طرح‌ها <Arrow />
          </Link>
        </>
      )}
    </div>
  );
}
```

(The `Arrow` component is already defined in this file — used by `CategoriesPanel`'s «همه‌ی محصولات» CTA.)

- [ ] **Step 2: Add CTA to MobileMenu DesignsSection**

In `/home/ahmad/Zhic/apps/web/src/components/layout/MobileMenu.tsx`, find the `DesignsSection` function. It currently ends with:

```tsx
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
        {items.map((d) => (
          <li key={d.id}>
            <Link
              href={`/designs/${encodeURIComponent(d.slug)}`}
              onClick={onLinkClick}
              className="block text-body font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
            >
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
```

Replace the closing `</ul>` + `</section>` lines with:

```tsx
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
        {items.map((d) => (
          <li key={d.id}>
            <Link
              href={`/designs/${encodeURIComponent(d.slug)}`}
              onClick={onLinkClick}
              className="block text-body font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
            >
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/designs"
        onClick={onLinkClick}
        className="mt-3 self-start text-body font-bold text-charcoal underline underline-offset-4 transition-colors duration-[var(--dur-hover)] hover:text-forest"
      >
        ← همه‌ی طرح‌ها
      </Link>
    </section>
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm --filter @zhic/web typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/components/layout/ProductsMegaMenu.tsx apps/web/src/components/layout/MobileMenu.tsx
git -C /home/ahmad/Zhic commit -m "feat(web/nav): restore «همه‌ی طرح‌ها» CTA on mega-menu + mobile menu (now that /designs exists)"
```

---

## Task 7: Add `/designs` to sitemap

**Files:**
- Modify: `apps/web/src/app/sitemap.ts`

- [ ] **Step 1: Read the sitemap file structure**

```bash
head -50 /home/ahmad/Zhic/apps/web/src/app/sitemap.ts
```

The file has a list of static URLs at the top and dynamic loops below. Find the static URL block — it should have entries like `/journal`, `/showrooms`, `/contact`, etc. each as `{ url, lastModified, changeFrequency, priority }`.

- [ ] **Step 2: Add the `/designs` static entry**

Add a new entry to the static URL array. Find the existing `/journal` entry (used as a sibling — both are listing pages with editorial weight) and add `/designs` next to it:

```ts
{
  url: `${BASE_URL}/designs`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as const,
  priority: 0.8,
},
```

Use whatever variable name the file uses for the base URL (could be `BASE_URL`, `SITE_URL`, `appUrl`, etc. — match existing style).

The per-slug `/designs/<slug>` entries already exist (added when the design detail page shipped). This is just the index entry.

- [ ] **Step 3: Verify typecheck + build**

```bash
pnpm --filter @zhic/web typecheck
pnpm --filter @zhic/web build
```

Expected: 0 errors. Build succeeds.

- [ ] **Step 4: Verify the sitemap output includes `/designs`**

```bash
pm2 restart zhic-web --silent
until curl -sf -o /dev/null http://localhost:3000/; do sleep 0.5; done
curl -s http://localhost:3000/sitemap.xml | grep -oE '<loc>[^<]*/designs[^<]*</loc>' | head -5
```

Expected output includes `<loc>...zhic.ir/designs</loc>` (the static index) plus per-slug entries like `<loc>...zhic.ir/designs/gandom</loc>`.

- [ ] **Step 5: Commit**

```bash
git -C /home/ahmad/Zhic add apps/web/src/app/sitemap.ts
git -C /home/ahmad/Zhic commit -m "feat(web/sitemap): add static /designs entry (index page now exists)"
```

---

## Task 8: Build + restart + smoke + manual verify

**Files:** None modified.

- [ ] **Step 1: Rebuild and restart**

```bash
pnpm --filter @zhic/web build
pm2 restart zhic-web
until curl -sf -o /dev/null http://localhost:3000/; do sleep 0.5; done
```

Expected: build clean. pm2 online. root URL 200.

- [ ] **Step 2: Smoke 3 URLs**

```bash
curl -s -o /dev/null -w "/designs → %{http_code}\n" http://localhost:3000/designs
curl -s -o /dev/null -w "/designs/gandom (detail page still works) → %{http_code}\n" http://localhost:3000/designs/gandom
curl -s -o /dev/null -w "/products?design=gandom (alternate URL preserved) → %{http_code}\n" "http://localhost:3000/products?design=gandom"
```

Expected: all three return `200`.

- [ ] **Step 3: HTML probes**

```bash
echo "--- title + h1 ---"
curl -s http://localhost:3000/designs | grep -oE '<title>[^<]+|<h1[^>]*>[^<]+' | head -3
echo "--- slider classes ---"
curl -s http://localhost:3000/designs | grep -oE 'zh-slider-(viewport|track|tile|arrow|caption|dot|counter)' | sort -u | head -10
echo "--- design hrefs ---"
curl -s http://localhost:3000/designs | grep -oE 'href="/designs/[^"]+"' | sort -u | wc -l
echo "--- mega-menu \"See all designs\" CTA ---"
curl -s http://localhost:3000/ | grep -oE 'href="/designs"[^>]*>[^<]+همه‌ی طرح‌ها' | head -2
```

Expected:
- Title contains «طرح‌ها», h1 also «طرح‌ها»
- Slider classes: at minimum `zh-slider-viewport`, `zh-slider-track`, `zh-slider-tile`, `zh-slider-arrow`, `zh-slider-caption`, `zh-slider-dot`, `zh-slider-counter`
- Design hrefs count = number of designs in DB (likely 17-18 valid; the design with empty slug renders an invalid href that the regex won't match)
- The «همه‌ی طرح‌ها» CTA appears in the root page mega-menu HTML

- [ ] **Step 4: Manual verify on a browser**

Open `http://80.240.31.146:3000/designs` on a phone and desktop. Confirm against the spec:

1. Title «طرح‌ها» renders centered, subtitle below.
2. Slider shows 3 tiles. Center tile has card chrome (border, rounded corners, drop shadow). Side tiles are at 40% opacity with NO chrome (no border, flat corners, no shadow).
3. The center tile's GIF (or placeholder gradient) spills 22% past the card's right edge, visually overlapping the right-neighbor dim tile.
4. Right-arrow (←) on the right side moves to the previous design; left-arrow (→) on the left side moves to the next. Both arrows sit above the spill (z-10).
5. Tap a dim side tile → it slides into center. Tap the center tile → navigates to `/designs/<slug>`.
6. Dots strip below caption — click a dot to jump.
7. Counter shows «N از M» with Persian digits.
8. Caption (name + tagline) cross-fades smoothly when focus changes.
9. On phone (≤ 768px viewport): same 3-visible layout, smaller tiles, same chrome rules, same spill proportion.
10. Wraps continuously — past the last design returns to the first; before the first goes to the last.
11. Mega-menu on desktop: hover «محصولات», tab «طرح‌ها», see the «همه‌ی طرح‌ها →» CTA at the bottom of the panel. Click it → lands on `/designs`.
12. Mobile menu: hamburger → محصولات → designs section now has «← همه‌ی طرح‌ها» link at the bottom. Tap it → lands on `/designs`.

Important caveat for testing: no design has a `sliderMedia` populated yet. Each tile renders the placeholder (cream→sand gradient + «ژ» watermark). To test with real media, go to Payload admin → `Designs` → pick a design → upload an image/GIF as `sliderMedia` → save → refresh `/designs`.

- [ ] **Step 5: No commit.** Verification only.

---

## Task 9: Update `docs/state.md`

**Files:** Modify: `docs/state.md`.

- [ ] **Step 1: Strike-through `FU-MM-a`**

In `/home/ahmad/Zhic/docs/state.md`, find the row:

```markdown
| ~~FU-MM-a~~ | MM | `/designs` index page — wire "See all" CTA for designs panel of the mega-menu. |
```

Wait — depending on prior edits, `FU-MM-a` may already be partially struck-through from earlier work. Find whatever the current state of that line is. If it's not yet struck, replace with:

```markdown
| ~~FU-MM-a~~ | MM | ~~`/designs` index page — wire "See all" CTA for designs panel of the mega-menu.~~ — **resolved 2026-05-17** via single-focus carousel page at `/designs` (dim sides without chrome, focused with card + 22% right-spill, manual nav). CTA restored on mega-menu DesignsPanel + mobile menu DesignsSection. |
```

- [ ] **Step 2: Strike-through `FU-DDP-d`**

Find:

```markdown
| FU-DDP-d | DDP | `/designs` index listing all designs as a lookbook grid. Carries forward FU-MM-a. |
```

Replace with:

```markdown
| ~~FU-DDP-d~~ | DDP | ~~`/designs` index listing all designs as a lookbook grid. Carries forward FU-MM-a.~~ — **resolved 2026-05-17** (not a grid; the index ships as a single-focus carousel per operator direction). |
```

- [ ] **Step 3: Append `FU-DIX-a` through `FU-DIX-f`**

Find the LAST row of the Follow-ups table (likely an earlier `FU-DDP-f` or similar — whichever is most recent). Append these 6 rows after it:

```markdown
| FU-DIX-a | DIX | GIF → video transcode pipeline on Payload upload (carries forward `FU-2.3-a`). Reduces media payload significantly; better preview controls. |
| FU-DIX-b | DIX | Filter pills above the slider — by `age_group` (نوزاد/کودک/نوجوان/بزرگسال). Useful when catalog grows past 25-30 designs. |
| FU-DIX-c | DIX | Lazy-load tile media beyond focused ± 2. Triggers when catalog exceeds 30 designs. |
| FU-DIX-d | DIX | Optional auto-play with pause-on-hover (operator picked manual; revisit if engagement metrics suggest passive browsing). |
| FU-DIX-e | DIX | Mini-grid alternate view — a button toggles slider ↔ grid (the discarded option B from brainstorming). For users who prefer scan-and-jump. |
| FU-DIX-f | DIX | Slider analytics — track which designs get clicked-to-detail. Surface findings to operator. |
| FU-DIX-g | DIX | Clone-tile wrap not in v1 — the wrap uses simple modulo, so at indices 0 / N-1 the focused tile sits at an edge instead of center. Production polish would clone the last 2 / first 2 tiles for seamless infinite loop per spec §5.3. Skipped in v1 for code simplicity. |
```

Note: `FU-DIX-g` is a real-but-deferred polish item — the spec §5.3 describes clone-tile wrapping for a seamless infinite loop, but the implementation in Task 4 uses simple modulo which leaves the focused tile at the edge slot when at index 0 or N-1. Documented as FU.

- [ ] **Step 4: Add a Post-Phase enhancements row**

Find the `### Post-Phase enhancements` section. Add this row beneath the existing rows:

```markdown
| Designs index page | ✅ | (PR HEAD) | New `/designs` carousel route. Designs collection extended with `sliderMedia` field. DesignsSlider client component with dim/focused chrome differentiation (focused tile gets card + 22% right-edge GIF spill). Manual nav (arrows + swipe + keyboard + dots). Mega-menu + mobile menu CTAs restored. Sitemap entry added. Closes FU-MM-a + FU-DDP-d. Spec: `docs/superpowers/specs/2026-05-17-designs-index-page-design.md`. Plan: `docs/superpowers/plans/2026-05-17-designs-index-page.md`. |
```

- [ ] **Step 5: Update Snapshot table's Current session**

Find the `Current session` row at the top of state.md and replace its value with:

```markdown
| Current session | Designs index page (`/designs` single-focus carousel) shipped on `feat/products-mega-menu`. Designs schema extended with sliderMedia. Closes FU-MM-a + FU-DDP-d. Branch now has: products mega-menu, mobile floating-island chrome, mobile two-state menu, design detail pages, bulk product import, and designs index. |
```

Leave `Last updated` at `2026-05-17`.

- [ ] **Step 6: Verify**

```bash
grep -n "FU-MM-a\|FU-DDP-d\|FU-DIX-a\|FU-DIX-g\|Designs index page\|Current session" /home/ahmad/Zhic/docs/state.md | head -10
```

Expected: strike-through on FU-MM-a + FU-DDP-d, 7 new FU-DIX-* rows visible, Post-Phase row visible, updated Current session.

- [ ] **Step 7: Commit**

```bash
git -C /home/ahmad/Zhic add docs/state.md
git -C /home/ahmad/Zhic commit -m "docs(state): /designs index shipped — close FU-MM-a + FU-DDP-d + log 7 follow-ups"
```

---

## Task 10: Push to origin

**Files:** None modified.

- [ ] **Step 1: Verify clean tree**

```bash
git -C /home/ahmad/Zhic status --short
```

Expected: empty.

- [ ] **Step 2: Push**

```bash
git -C /home/ahmad/Zhic push
```

Expected: ~7 new commits pushed.

- [ ] **Step 3: Show branch state**

```bash
git -C /home/ahmad/Zhic log --oneline staging..HEAD | head -10
```

Expected: top commits are the Task 2–9 outputs.

- [ ] **Step 4: STOP — do not create PR.** Operator opens PRs per repo pattern.

---

## Spec coverage matrix

| Spec § | Requirement | Task |
|---|---|---|
| §0 | Scope cuts captured | Plan §"Notes" + Task 9 (FU-DIX-* follow-ups) |
| §1.1 | Tile chrome differentiation (dim/focused/spill/z-stacking/mobile) | Task 4 CSS + Task 4 component |
| §1.2 | Slider behavior (arrows, dots, keyboard, swipe, click semantics) | Task 4 component |
| §1.3 | Caption + indicator | Task 4 component |
| §2 | Designs schema + migration + fallback chain | Task 2 + Task 4 TileMedia |
| §2.1 | Migration applied via direct pg + registered | Task 2 |
| §3 | Files created + modified | Tasks 2–7 |
| §4 | Page composition + edge cases (0/1/2/≥3 designs) | Task 5 + Task 4 (fallback components) |
| §5.1-5.7 | Component contract (props, state, nav, caption, ARIA, perf) | Task 4 |
| §5.8 | Tile structure + chrome CSS | Task 4 |
| §6 | TileMedia + TilePlaceholder | Task 4 (inline helpers in DesignsSlider) |
| §7 | Mega-menu + mobile menu «See all» CTA | Task 6 |
| §8 | SEO metadata + sitemap entry | Task 5 (metadata) + Task 7 (sitemap) |
| §9 | 19 acceptance criteria | Task 8 manual verify |
| §10 | Follow-ups logged | Task 9 |

**Spec gap**: §5.3 describes clone-tile infinite-loop wrap; the implementation in Task 4 uses simple modulo for code simplicity (leaves the focused tile at an edge slot at indices 0 / N-1). This is intentional v1 scope and logged as `FU-DIX-g` in Task 9. The user can choose to upgrade to true clone-wrap in a follow-up PR if the edge behavior bothers operators.

---

## Out of scope (captured as FU-DIX-* in `state.md`)

- GIF → video transcode → `FU-DIX-a`
- Age-group filter pills → `FU-DIX-b`
- Lazy-load tile media → `FU-DIX-c`
- Auto-play option → `FU-DIX-d`
- Slider ↔ grid toggle → `FU-DIX-e`
- Click analytics → `FU-DIX-f`
- Clone-tile seamless wrap → `FU-DIX-g`
