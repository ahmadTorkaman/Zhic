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
        <div className="text-lead font-black leading-[var(--leading-h2)] text-ink md:text-h4">
          <CountUp value={value} suffix={suffix} />
        </div>
        {/* charcoal, not stone — the label half of the glass card sits
            over the dark section and stone washes out there */}
        <div className="mt-1 text-small font-light text-charcoal">{label}</div>
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
