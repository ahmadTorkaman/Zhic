import type { PayloadFaqItem } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

export function FaqAccordion({ items }: { items: PayloadFaqItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-body text-stone">
        هنوز سوالی اضافه نشده است.
      </p>
    );
  }

  return (
    <div className="divide-y divide-sand">
      {items.map((item, idx) => (
        <details key={idx} className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-h4 font-bold text-charcoal hover:text-accent [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              className="shrink-0 transition-transform group-open:rotate-45"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
          </summary>
          <div className="pb-5 pe-8">
            <div className="max-w-prose">
              <RichText value={item.answer} />
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
