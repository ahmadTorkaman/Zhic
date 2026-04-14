import {
  color,
  spacing,
  radius,
  fontSize,
  duration,
  easing,
  breakpoint,
  zIndex,
} from '@zhic/design-system';

/**
 * /lab/tokens — Session 1.2 verification surface.
 *
 * Renders every token exported by `@zhic/design-system` so a human can
 * eyeball that:
 *   - Colors match docs/spec/design-system.md §2.1
 *   - Ayandeh is actually loaded (Persian renders in the correct face)
 *   - Spacing and radius scales are proportional
 *   - The document is `lang="fa" dir="rtl"` (check dev tools)
 *
 * This is a lab page, not a designed page. Utilitarian on purpose.
 */

const PERSIAN_PANGRAM = 'می‌خواهید ساخته‌شده برای ماندن باشد. ۱۲۳۴۵۶۷۸۹۰';
const LATIN_PANGRAM = 'The quick brown fox jumps over the lazy dog. 1234567890';

export default function TokensLabPage() {
  return (
    <div className="space-y-16">
      <header className="space-y-2">
        <p className="text-eyebrow font-bold uppercase tracking-[0.2em] text-stone">
          Session 1.2 · Verification
        </p>
        <h1 className="text-h1 font-black text-charcoal">
          توکن‌های طراحی — Design Tokens
        </h1>
        <p className="text-body text-stone">
          هر توکن در <code dir="ltr">packages/design-system</code> از این
          صفحه خوانده می‌شود. اگر چیزی اشتباه است، خود توکن اشتباه است.
        </p>
      </header>

      {/* ── Color ────────────────────────────────────────────────── */}
      <Section title="Color" subtitle="§2.1">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Object.entries(color).map(([name, value]) => (
            <ColorSwatch key={name} name={name} value={value} />
          ))}
        </div>
      </Section>

      {/* ── Typography ───────────────────────────────────────────── */}
      <Section title="Typography — Ayandeh" subtitle="§2.2">
        <div className="space-y-6 border-t border-sand pt-6">
          {Object.entries(fontSize).map(([name, def]) => (
            <TypeRow key={name} name={name} def={def} />
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <WeightSample weight={300} label="Light (300)" />
          <WeightSample weight={400} label="Regular (400)" />
          <WeightSample weight={700} label="Bold (700)" />
          <WeightSample weight={900} label="Black (900)" />
        </div>
      </Section>

      {/* ── Spacing ──────────────────────────────────────────────── */}
      <Section title="Spacing" subtitle="§2.3 · 8-pt base">
        <div className="space-y-2">
          {Object.entries(spacing).map(([step, value]) => (
            <div key={step} className="flex items-center gap-4">
              <span className="w-24 text-small font-bold text-stone">
                space-{step}
              </span>
              <span className="w-20 text-small text-stone" dir="ltr">
                {value}
              </span>
              <span
                className="block h-4 bg-charcoal"
                style={{ width: value }}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Radius ───────────────────────────────────────────────── */}
      <Section title="Radius" subtitle="§2.5">
        <div className="flex flex-wrap gap-6">
          {Object.entries(radius).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className="h-24 w-24 border border-sand bg-cream"
                style={{ borderRadius: value }}
              />
              <span className="text-small font-bold">{name}</span>
              <span className="text-small text-stone" dir="ltr">
                {value}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Motion ───────────────────────────────────────────────── */}
      <Section title="Motion" subtitle="§6.3 · durations + easings">
        <div className="grid gap-6 md:grid-cols-2">
          <KeyValue title="Durations (storefront)">
            {(['instant', 'fast', 'base', 'slow', 'glacial'] as const).map(
              (k) => (
                <Row key={k} k={k} v={duration[k]} />
              ),
            )}
          </KeyValue>
          <KeyValue title="Durations (operator)">
            {(['opFast', 'opBase', 'opSlow'] as const).map((k) => (
              <Row key={k} k={k} v={duration[k]} />
            ))}
          </KeyValue>
          <KeyValue title="Easings">
            {(Object.keys(easing) as Array<keyof typeof easing>).map((k) => (
              <Row key={k} k={k} v={easing[k]} mono />
            ))}
          </KeyValue>
        </div>
      </Section>

      {/* ── Breakpoints + z-index ────────────────────────────────── */}
      <Section title="Breakpoints & Z-index" subtitle="§2.7, §2.8">
        <div className="grid gap-6 md:grid-cols-2">
          <KeyValue title="Breakpoints">
            {(Object.keys(breakpoint) as Array<keyof typeof breakpoint>).map(
              (k) => (
                <Row key={k} k={k} v={breakpoint[k]} />
              ),
            )}
          </KeyValue>
          <KeyValue title="Z-index">
            {(Object.keys(zIndex) as Array<keyof typeof zIndex>).map((k) => (
              <Row key={k} k={k} v={String(zIndex[k])} />
            ))}
          </KeyValue>
        </div>
      </Section>

      {/* ── Direction proof ──────────────────────────────────────── */}
      <Section title="Direction proof" subtitle="§2.4 logical properties">
        <div className="space-y-4 border border-sand p-6">
          <p className="text-body">
            این پاراگراف باید از راست به چپ خوانده شود. عددها به صورت
            فارسی نمایش داده می‌شوند: ۱۲۳۴. کلمه‌ی{' '}
            <span dir="ltr" lang="en">
              Zhic
            </span>{' '}
            به صورت لاتین درون متن فارسی نمایش داده می‌شود.
          </p>
          <div className="flex items-center gap-2 text-small text-stone">
            <span className="bg-saffron/20 ps-4">ps-4 (padding-inline-start)</span>
            <span className="bg-moss/20 pe-4">pe-4 (padding-inline-end)</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3 border-b border-sand pb-2">
        <h2 className="text-h3 font-bold text-charcoal">{title}</h2>
        {subtitle && (
          <span className="text-small text-stone" dir="ltr">
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border border-sand">
      <div
        className="h-24 w-full border-b border-sand"
        style={{ backgroundColor: value }}
      />
      <div className="flex items-baseline justify-between px-3 pb-2 text-small">
        <span className="font-bold">{name}</span>
        <span className="text-stone" dir="ltr">
          {value}
        </span>
      </div>
    </div>
  );
}

function TypeRow({
  name,
  def,
}: {
  name: string;
  def: { value: string; lineHeight: number; weight: number };
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-3 text-small text-stone">
        <span className="w-24 font-bold uppercase tracking-[0.2em]" dir="ltr">
          {name}
        </span>
        <span dir="ltr">
          {def.value} · lh {def.lineHeight} · w{def.weight}
        </span>
      </div>
      <p
        dir="rtl"
        style={{
          fontSize: def.value,
          lineHeight: def.lineHeight,
          fontWeight: def.weight,
        }}
      >
        {PERSIAN_PANGRAM}
      </p>
      <p
        dir="ltr"
        style={{
          fontSize: def.value,
          lineHeight: def.lineHeight,
          fontWeight: def.weight,
        }}
      >
        {LATIN_PANGRAM}
      </p>
    </div>
  );
}

function WeightSample({
  weight,
  label,
}: {
  weight: number;
  label: string;
}) {
  return (
    <div className="border border-sand p-4">
      <p className="mb-2 text-small text-stone" dir="ltr">
        {label}
      </p>
      <p className="text-h4" style={{ fontWeight: weight }}>
        آهسته زیستن، هنر ماندن است. Zhic.
      </p>
    </div>
  );
}

function KeyValue({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-sand p-4">
      <p className="mb-3 text-small font-bold uppercase tracking-[0.2em] text-stone" dir="ltr">
        {title}
      </p>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 text-small" dir="ltr">
      <dt className="w-24 font-bold text-charcoal">{k}</dt>
      <dd
        className={`text-stone ${mono ? 'font-mono text-[11px]' : ''}`}
      >
        {v}
      </dd>
    </div>
  );
}
