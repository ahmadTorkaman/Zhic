# Home Stats Band + About Section Restyle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the homepage stats band into a floating ivory card overlapping the dark about section, add an optional CMS photo to the about block (keeping all paragraphs), and land every new visual component as reusable token-driven recipes in the design system.

**Architecture:** Two new tokens + three new recipe classes in `packages/design-system/css/` (the `.glass-card` pattern); a new `on-dark-solid` Button variant in `@zhic/ui`; a `variant` prop on `StatBlock`; an optional `about_media` upload on the Payload `home` global flowing through `fetchHome()` into a restructured `HomeBrandStatement`.

**Tech Stack:** Next.js 16 / React 19 / TypeScript 5, Tailwind v4 + CSS custom properties, Payload 3 (Postgres), vitest + @testing-library/react, Turborepo + pnpm.

**Spec:** `docs/superpowers/specs/2026-06-05-home-stats-about-restyle-design.md`

**Conventions that bind this plan (from CLAUDE.md):**
- Tokens are added to `packages/design-system` *and* documented in `docs/spec/design-system.md` before components use them.
- CMS field additions must update `docs/spec/data-schemas.md`.
- Logical CSS properties only (`border-inline-start`, `margin-block-start`).
- Last step of the session updates `docs/state.md`.

---

### Task 1: Design tokens + design-system doc

**Files:**
- Modify: `packages/design-system/css/tokens.css` (colors block ~line 17, spacing block ~line 72)
- Modify: `docs/spec/design-system.md` (color token table, ~line 98)

- [ ] **Step 1: Add the two tokens to `tokens.css`**

In the functional-colors area, directly after the `--color-rust: #8B4A2B;` line, add:

```css
  --color-divider-ink: rgba(20, 17, 15, 0.08); /* hairline dividers on light surfaces */
```

After the `--space-12: 16rem;` line (end of the spacing scale), add:

```css
  /* Section-boundary overlap — how far a floating card crosses a section edge */
  --section-overlap: clamp(2.5rem, 6vw, 4.5rem);
```

- [ ] **Step 2: Document the tokens in `docs/spec/design-system.md`**

In the color token list (the block containing `--color-sand        #E8E0D8   dividers, hairlines, hover fills`, ~line 98), add directly below the sand row:

```
--color-divider-ink rgba(20,17,15,0.08)   hairline dividers on light surfaces (stat rows)
```

In the same document, find the spacing/tokens narrative and add a short line wherever the spacing scale is described:

```
--section-overlap   clamp(2.5rem, 6vw, 4.5rem)   distance a floating card (.float-card + .section-overlap-top) crosses a section boundary
```

- [ ] **Step 3: Verify the web app still builds tokens (no typos)**

Run: `cd /home/ahmad/Zhic && pnpm --filter @zhic/web test`
Expected: existing tests PASS (tokens.css is not parsed by vitest; this catches accidental file corruption via the css import chain in component tests).

- [ ] **Step 4: Commit**

```bash
git add packages/design-system/css/tokens.css docs/spec/design-system.md
git commit -m "feat(design-system): add divider-ink + section-overlap tokens"
```

---

### Task 2: Recipe classes — `.float-card`, `.section-overlap-top`, `.stat-row`/`.stat-cell`

**Files:**
- Modify: `packages/design-system/css/base.css` (insert after the `.glass-card-dark` block, ~line 76)
- Modify: `docs/spec/design-system.md` (component inventory)

- [ ] **Step 1: Add the recipes to `base.css`**

Insert after the `.glass-card-dark:hover { ... }` rule and before the `/* ── Site header chrome` comment:

```css
/* ── Floating card (straddles a section boundary) ─────────────────── */
/* Solid ivory card meant to sit across the edge between a light and a
   dark section. Pair with .section-overlap-top as the FIRST child of
   the lower (dark) section — the negative margin pulls it up so its
   top half floats over the previous section's background. */
.float-card {
  background: var(--color-ivory);
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevated);
}

.section-overlap-top {
  position: relative;
  z-index: var(--z-raised);
  margin-block-start: calc(-1 * var(--section-overlap));
}

/* ── Divided stat row (on light surfaces) ─────────────────────────── */
/* 3-up stat grid with hairline vertical dividers. Logical borders so
   RTL needs no overrides. Cells style their own type (see StatBlock
   variant="divided"). */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stat-cell {
  padding-inline: var(--space-4);
  padding-block: var(--space-5);
  text-align: center;
}

.stat-cell + .stat-cell {
  border-inline-start: 1px solid var(--color-divider-ink);
}
```

**Important:** the parent section must NOT have `overflow-hidden`, or the pulled-up card gets clipped. Task 6 handles this in `HomeBrandStatement`.

- [ ] **Step 2: Document the recipes in `docs/spec/design-system.md`**

In the component inventory section, add:

```
- **Float card** (`.float-card` + `.section-overlap-top`): solid ivory card that straddles a section boundary; first child of the lower section, pulled up by --section-overlap. Used by the homepage stats band.
- **Stat row** (`.stat-row` / `.stat-cell`): 3-up divided stats on a light surface; hairline dividers via --color-divider-ink; pairs with StatBlock variant="divided".
```

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/css/base.css docs/spec/design-system.md
git commit -m "feat(design-system): float-card, section-overlap-top, stat-row recipes"
```

---

### Task 3: `Button` variant `on-dark-solid` (TDD)

**Files:**
- Create: `packages/ui/src/__tests__/Button.test.tsx`
- Modify: `packages/ui/src/Button.tsx:4` (Variant union) and `:29-35` (VARIANT_CLASSES)

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/__tests__/Button.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '../Button';

describe('<Button variant="on-dark-solid">', () => {
  it('renders a solid ivory button with ink text', () => {
    const { container } = render(
      <Button variant="on-dark-solid">بیش‌تر درباره‌ی ما</Button>
    );
    const el = container.querySelector('button')!;
    expect(el).not.toBeNull();
    expect(el.className).toContain('bg-ivory');
    expect(el.className).toContain('text-ink');
    expect(el.className).toContain('focus-ring-invert');
  });

  it('renders as an anchor when as="a"', () => {
    const { container } = render(
      <Button as="a" href="/about" variant="on-dark-solid">x</Button>
    );
    const a = container.querySelector('a[href="/about"]')!;
    expect(a).not.toBeNull();
    expect(a.className).toContain('bg-ivory');
  });

  it('keeps the existing on-dark variant unchanged', () => {
    const { container } = render(<Button variant="on-dark">x</Button>);
    expect(container.querySelector('button')!.className).toContain('border-ivory/15');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zhic/ui test -- Button`
Expected: FAIL — TS error / `Type '"on-dark-solid"' is not assignable to type 'Variant'` (or class assertion failure).

- [ ] **Step 3: Implement the variant**

In `packages/ui/src/Button.tsx`, change line 4:

```ts
type Variant = 'primary' | 'accent' | 'ghost' | 'on-dark' | 'on-dark-solid' | 'link';
```

In `VARIANT_CLASSES`, add after the `'on-dark'` entry:

```ts
  'on-dark-solid': 'bg-ivory text-ink hover:bg-cream hover:-translate-y-px hover:shadow-elevated focus-ring-invert',
```

(`-translate-y-px` matches the existing Button hover convention — `primary`/`accent` use the same lift; this fulfils the spec's "lift on hover" intent.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @zhic/ui test`
Expected: PASS (all ui tests, including FadeUp).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Button.tsx packages/ui/src/__tests__/Button.test.tsx
git commit -m "feat(ui): Button on-dark-solid variant (ivory fill for dark grounds)"
```

---

### Task 4: `StatBlock` variant prop (TDD)

**Files:**
- Create: `apps/web/src/components/home/__tests__/StatBlock.test.tsx`
- Modify: `apps/web/src/components/home/StatBlock.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/home/__tests__/StatBlock.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { StatBlock } from '../StatBlock';

describe('<StatBlock>', () => {
  it('defaults to the gold-border look (unchanged existing consumers)', () => {
    const { container } = render(<StatBlock value={25} suffix="+" label="سال تجربه" />);
    const root = container.firstElementChild!;
    expect(root.className).toContain('border-gold');
    expect(root.className).not.toContain('stat-cell');
  });

  it('variant="divided" renders a stat-cell with ink numeral and stone label', () => {
    const { container } = render(
      <StatBlock variant="divided" value={1200} suffix="+" label="قطعه مبلمان تولیدشده" />
    );
    const root = container.firstElementChild!;
    expect(root.className).toContain('stat-cell');
    expect(root.className).not.toContain('border-gold');
    expect(root.querySelector('.text-ink')).not.toBeNull();
    expect(root.querySelector('.text-stone')).not.toBeNull();
    expect(root.textContent).toContain('قطعه مبلمان تولیدشده');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @zhic/web test -- StatBlock`
Expected: FAIL — `variant` prop does not exist / `stat-cell` class missing.

- [ ] **Step 3: Implement the variant**

Replace the full contents of `apps/web/src/components/home/StatBlock.tsx`:

```tsx
import { CountUp } from '@zhic/ui';

export type StatBlockProps = {
  value: number;
  suffix?: string;
  label: string;
  /** 'gold-border' (default): ivory-on-dark with gold inline-start border.
      'divided': for use inside a light `.stat-row` — the row supplies
      hairline dividers; the cell centers ink numerals over stone labels. */
  variant?: 'gold-border' | 'divided';
};

export function StatBlock({ value, suffix, label, variant = 'gold-border' }: StatBlockProps) {
  if (variant === 'divided') {
    return (
      <div className="stat-cell">
        <div className="text-lead font-black leading-[var(--leading-h2)] text-ink md:text-h2">
          <CountUp value={value} suffix={suffix} />
        </div>
        <div className="mt-1 text-small font-light text-stone">{label}</div>
      </div>
    );
  }

  return (
    <div className="border-s-2 border-gold ps-5">
      <div className="text-lead font-black leading-[var(--leading-h2)] text-ivory md:text-h2">
        <CountUp value={value} suffix={suffix} />
      </div>
      <div className="mt-1 text-small font-light text-sand">{label}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @zhic/web test -- StatBlock`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/home/StatBlock.tsx apps/web/src/components/home/__tests__/StatBlock.test.tsx
git commit -m "feat(web): StatBlock divided variant for light stat rows"
```

---

### Task 5: CMS — `about_media` field on the `home` global

**Files:**
- Modify: `services/api/src/globals/Home.ts` (after the `brand_statement` field, ~line 58)
- Modify: `docs/spec/data-schemas.md` (§63 area, ~line 1095)
- Create: generated migration in `services/api/src/migrations/`

- [ ] **Step 1: Add the field to the Home global**

In `services/api/src/globals/Home.ts`, insert after the `brand_statement` field object (after line 58's closing `},`):

```ts
    {
      name: 'about_media',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر بخش درباره (از همدان، برای ایران)',
      admin: {
        description: 'اختیاری — اگر خالی باشد، بخش درباره فقط متن نمایش می‌دهد.',
      },
    },
```

- [ ] **Step 2: Document the field in `docs/spec/data-schemas.md`**

In §63 (`pages`), directly after the paragraph ending "…are stored as documents with reserved slugs." (~line 1096), add:

```markdown
> **Note (2026-06-05):** the implemented `home` **global** (services/api/src/globals/Home.ts)
> additionally carries `about_media` (upload → media, optional) — the photo for the
> homepage «از همدان، برای ایران» section. When empty the section renders text-only.
```

- [ ] **Step 3: Generate the migration**

The Postgres adapter needs a schema migration for the new relation column. DB must be running (`docker compose up -d` from repo root if it isn't).

Run: `pnpm --filter @zhic/api migrate:create add_home_about_media`
Expected: a new file `services/api/src/migrations/<timestamp>_add_home_about_media.ts` plus an updated `index.ts`. Inspect the generated SQL — it should add an `about_media_id` column (integer FK to media) on the home global table. If the generator emits unrelated drift, remove the unrelated statements and keep only the about_media changes (match the style of `20260530_200000_add_after_sales_years_to_products.ts`).

- [ ] **Step 4: Run the migration**

Run: `pnpm --filter @zhic/api migrate`
Expected: `Migrated: <timestamp>_add_home_about_media` with no errors.
Then: `pnpm --filter @zhic/api test`
Expected: existing api tests PASS.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/globals/Home.ts services/api/src/migrations/ docs/spec/data-schemas.md
git commit -m "feat(api): optional about_media upload on home global"
```

---

### Task 6: Web wiring — `PayloadHome` type, restructured `HomeBrandStatement`, page prop

**Files:**
- Modify: `apps/web/src/lib/payload.ts:171-180` (PayloadHome type)
- Modify: `apps/web/src/components/home/HomeBrandStatement.tsx` (full restructure)
- Modify: `apps/web/src/app/(site)/page.tsx:107` (pass the new prop)

- [ ] **Step 1: Extend `PayloadHome`**

In `apps/web/src/lib/payload.ts`, inside `PayloadHome` (after the `brand_statement` line):

```ts
  about_media?: PayloadMedia | null;
```

- [ ] **Step 2: Restructure `HomeBrandStatement`**

Replace the full contents of `apps/web/src/components/home/HomeBrandStatement.tsx`:

```tsx
import { BlurInText, Button, Container } from '@zhic/ui';
import { StatBlock } from './StatBlock';
import { PayloadImage } from '@/components/PayloadImage';
import { RichText } from '@/lib/richtext';
import type { LexicalRoot, PayloadMedia } from '@/lib/payload';

export type BrandStat = {
  value: number;
  suffix?: string;
  label: string;
};

export type HomeBrandStatementProps = {
  statement?: LexicalRoot | null;
  stats?: BrandStat[];
  heading?: string;
  eyebrow?: string;
  aboutHref?: string;
  aboutMedia?: PayloadMedia | null;
};

const DEFAULT_STATS: BrandStat[] = [
  { value: 25, suffix: '+', label: 'سال تجربه در صنایع چوب' },
  { value: 1200, suffix: '+', label: 'قطعه مبلمان تولیدشده' },
  { value: 3, label: 'شوروم در سراسر ایران' },
];

export function HomeBrandStatement({
  statement,
  stats = DEFAULT_STATS,
  heading = 'از همدان، برای ایران',
  eyebrow = 'درباره‌ی ژیک',
  aboutHref = '/about',
  aboutMedia = null,
}: HomeBrandStatementProps) {
  return (
    /* NO overflow-hidden here — it would clip the pulled-up stats card.
       The decorative glow is clipped by its own inset-0 wrapper instead. */
    <section className="relative bg-forest-dark pb-7 text-ivory md:pb-11">
      {/* Caramel radial glow in bottom-start corner (RTL: start = right visually) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -bottom-[120px] -start-[120px] h-[500px] w-[500px]"
          style={{ background: 'radial-gradient(circle, rgba(196,154,108,0.06) 0%, transparent 70%)' }}
        />
      </div>
      <Container>
        {/* Floating ivory stats card — straddles the ivory/dark boundary.
            text-charcoal resets the section's text-ivory for the light surface. */}
        <div className="float-card stat-row section-overlap-top text-charcoal">
          {stats.map((s, i) => (
            <StatBlock key={i} variant="divided" value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>

        <div
          className={
            aboutMedia
              ? 'mt-7 grid items-center gap-[var(--space-6)] md:mt-9 md:grid-cols-[3fr_2fr] md:gap-[var(--space-10)]'
              : 'mt-7 md:mt-9'
          }
        >
          <div>
            <BlurInText as="div" className="mb-5 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-gold">
              {eyebrow}
            </BlurInText>
            <BlurInText as="h2" className="mb-5 text-h2 font-black leading-[var(--leading-h2)] text-ivory">
              {heading}
            </BlurInText>
            <div className="mb-6">
              {statement ? (
                <div className="text-body font-light leading-[1.85] text-sand">
                  <RichText value={statement} />
                </div>
              ) : (
                <BlurInText as="p" className="text-body font-light leading-[1.85] text-sand">
                  ژیک در کارگاهی در همدان متولد شد — جایی که سنت کار با چوب ریشه در قرن‌ها دارد. ما چوب گردو را از جنگل‌های شمال تهیه می‌کنیم و با روش‌هایی می‌سازیم که عجله‌ای در آن‌ها نیست. هر قطعه یک سرمایه‌گذاری در آرامش است.
                </BlurInText>
              )}
            </div>
            <Button as="a" href={aboutHref} variant="on-dark-solid" size="md">
              بیش‌تر درباره‌ی ما
            </Button>
          </div>
          {aboutMedia ? (
            /* Mobile: image above the text (order-first). Desktop: second
               grid column — in RTL that places it inline-end of the text. */
            <div className="overflow-hidden rounded-md max-md:order-first">
              <PayloadImage
                media={aboutMedia}
                className="aspect-[4/3] h-auto w-full object-cover md:aspect-auto md:h-full md:min-h-[320px]"
              />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
```

Note what changed vs. today: stats moved out of `.glass-card-dark` into the floating row; `py-7 md:py-11` became `pb-…` only (the card occupies the section's top edge); the glow gained a clipping wrapper because the section lost `overflow-hidden`; CTA variant `on-dark` → `on-dark-solid`. Eyebrow, heading, paragraphs, fallback copy: byte-identical.

- [ ] **Step 3: Pass the prop from the page**

In `apps/web/src/app/(site)/page.tsx` line 107, change:

```tsx
      <HomeBrandStatement statement={home?.brand_statement ?? null} />
```

to:

```tsx
      <HomeBrandStatement
        statement={home?.brand_statement ?? null}
        aboutMedia={home?.about_media ?? null}
      />
```

- [ ] **Step 4: Typecheck + run web tests**

Run: `pnpm --filter @zhic/web test`
Expected: PASS, including the StatBlock tests from Task 4.

If there is a standalone typecheck script (`pnpm --filter @zhic/web exec tsc --noEmit`), run it; expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/payload.ts apps/web/src/components/home/HomeBrandStatement.tsx "apps/web/src/app/(site)/page.tsx"
git commit -m "feat(web): floating stats card + about media in HomeBrandStatement"
```

---

### Task 7: Visual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev stack**

Run from repo root: `pnpm dev` (turbo runs `@zhic/web` on :3000 and `@zhic/api` on :3001; DB via `docker compose up -d` if not already running).
Wait for both to be ready (`curl -s localhost:3000 >/dev/null && echo up`).

- [ ] **Step 2: Screenshot mobile + desktop**

A headless-chromium screenshot harness already exists at `/tmp/zhic-figma/` (playwright-core + locally extracted libs). Reuse it:

```bash
cd /tmp/zhic-figma && cat > verify.js <<'EOF'
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true,
  });
  for (const [name, vp] of [['mobile', {width:430,height:932}], ['desktop', {width:1440,height:900}]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 90000 });
    await page.evaluate(async () => {
      const d = document.scrollingElement;
      for (let y = 0; y < d.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    });
    // Scroll the stats/about section into view: find the heading
    await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2')].find(e => e.textContent.includes('از همدان'));
      if (h) h.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `verify-${name}.png` });
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
EOF
LD_LIBRARY_PATH=/tmp/zhic-figma/libs/extracted/usr/lib/x86_64-linux-gnu node verify.js
```

If `/tmp/zhic-figma/` no longer exists, recreate it: `mkdir -p /tmp/zhic-figma/libs && cd /tmp/zhic-figma && npm init -y && npm i playwright-core && cd libs && apt-get download libatk1.0-0t64 libatk-bridge2.0-0t64 libasound2t64 libxdamage1 libatspi2.0-0t64 && for d in *.deb; do dpkg -x "$d" extracted/; done`.

- [ ] **Step 3: Check against the acceptance criteria**

Read `verify-mobile.png` and `verify-desktop.png` and confirm:
1. The ivory stats card straddles the ivory/dark boundary (top half on light, bottom half on dark).
2. Three stat cells with hairline vertical dividers, ink numerals, stone labels, centered.
3. CTA «بیش‌تر درباره‌ی ما» is solid ivory with ink text.
4. With `about_media` unset (default state): about block is text-only, all paragraphs present.
5. Desktop: stats card is a full-content-width horizontal row; mobile matches the Figma stacking. Reference: `/tmp/zhic-figma/sbs-4-stats-about.png` (Figma = left column).
6. Nothing on the page above the section is overlapped incorrectly; no clipped card.

- [ ] **Step 4 (optional, if an admin user is available): upload a test image**

In Payload admin (`localhost:3001/admin`) → صفحه اصلی → set «تصویر بخش درباره», save, reload the homepage, re-run the screenshot script. Confirm: desktop shows text (wide) | image (narrow, inline-end in RTL); mobile shows image above text. Remove the test image afterwards if it was a placeholder.

- [ ] **Step 5: Regression sweep**

Run: `pnpm --filter @zhic/ui test && pnpm --filter @zhic/web test && pnpm --filter @zhic/api test`
Expected: all PASS. Visually confirm (in the desktop screenshot) that the header, hero, rooms tiles, journal, and showrooms sections look unchanged.

---

### Task 8: Update `docs/state.md` and finish

**Files:**
- Modify: `docs/state.md`

- [ ] **Step 1: Add a session entry**

Follow the existing entry format in `docs/state.md` (read the top of the file first). Record: Figma stats/about restyle shipped — new design-system recipes (`.float-card`, `.section-overlap-top`, `.stat-row`/`.stat-cell`), tokens (`--color-divider-ink`, `--section-overlap`), Button `on-dark-solid`, StatBlock `divided` variant, `about_media` field on home global (empty → text-only fallback; CEO to upload the workshop photo). Reference the spec and this plan.

- [ ] **Step 2: Commit**

```bash
git add docs/state.md
git commit -m "docs(state): log home stats/about restyle session"
```

---

## Self-review notes

- **Spec coverage:** tokens → Task 1; recipes → Task 2; Button variant → Task 3; StatBlock variant → Task 4; CMS field + fallback → Task 5; type/wiring/restructure + desktop adaptation → Task 6; verification incl. text-only fallback and regression → Task 7. CLAUDE.md doc obligations → Tasks 1, 2, 5, 8.
- **Overflow-hidden hazard** (clipping the pulled-up card) is called out in Tasks 2 and 6 and checked in Task 7.
- **Existing consumers:** `StatBlock` has no consumers besides `HomeBrandStatement` (verified by grep), and the default variant is byte-identical to today's markup; `.glass-card-dark` recipe untouched.
