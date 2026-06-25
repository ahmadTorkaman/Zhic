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
        {/* Prominent stat number, explicit size (not a clamp floor); one line so
            the long count stays on one line. 20px mobile → 24px desktop. */}
        <div className="text-[1.125rem] font-black leading-[var(--leading-h2)] tracking-[-0.02em] whitespace-nowrap text-ink md:text-[1.375rem]">
          <CountUp value={value} suffix={suffix} />
        </div>
        {/* Kaveh (19:183): white labels — the label half sits over the dark
            green band, so they read light, not dark. */}
        <div className="mt-1 mx-auto max-w-[11ch] text-small font-light text-ivory">{label}</div>
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
