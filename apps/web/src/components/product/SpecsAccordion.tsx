import type { ReactNode } from 'react';

export type SpecEntry = { label: string; content: ReactNode };

export type SpecsAccordionProps = {
  specs: SpecEntry[];
  /** First entry open by default. */
  initialOpenIndex?: number;
};

export function SpecsAccordion({ specs, initialOpenIndex = 0 }: SpecsAccordionProps) {
  if (specs.length === 0) return null;

  return (
    <div>
      {specs.map((spec, i) => (
        <details
          key={i}
          className="group border-b border-sand py-4"
          open={i === initialOpenIndex}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-body font-bold text-charcoal [&::-webkit-details-marker]:hidden">
            <span>{spec.label}</span>
            <span
              aria-hidden
              className="text-stone transition-transform duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="mt-3 text-small font-light leading-[1.7] text-stone">
            {spec.content}
          </div>
        </details>
      ))}
    </div>
  );
}
