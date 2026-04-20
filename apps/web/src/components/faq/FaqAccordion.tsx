import { RichText } from '@/lib/richtext';
import type { PayloadFaqItem } from '@/lib/payload';

export type FaqAccordionProps = {
  items: PayloadFaqItem[];
  /** Index of the item that should render `open` by default. Default 0. */
  initialOpenIndex?: number;
};

export function FaqAccordion({ items, initialOpenIndex = 0 }: FaqAccordionProps) {
  if (items.length === 0) {
    return <p className="text-stone">پرسشی پیدا نشد.</p>;
  }
  return (
    <div>
      {items.map((item, i) => (
        <details
          key={i}
          open={i === initialOpenIndex}
          className="group border-b border-sand py-4 [&::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-body font-bold text-charcoal">
            <span>{item.question}</span>
            <span
              aria-hidden
              className="shrink-0 text-h4 font-light text-stone transition-transform duration-[var(--dur-hover)] group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="mt-3 text-body font-light leading-[1.85] text-stone">
            <RichText value={item.answer} />
          </div>
        </details>
      ))}
    </div>
  );
}
