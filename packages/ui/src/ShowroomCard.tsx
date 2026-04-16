import type { ReactNode } from 'react';
import { Aspect } from './Aspect';
import { cn } from './cn';
import { CARD_BASE, CARD_INTERACTIVE, CARD_IMAGE_ZOOM } from './cardClasses';

export type ShowroomCardProps = {
  href?: string;
  name: ReactNode;
  cover: ReactNode;
  city?: ReactNode;
  addressLine?: ReactNode;
  hoursSummary?: ReactNode;
  phone?: { label: ReactNode; e164: string };
  className?: string;
};

export function ShowroomCard({
  href,
  name,
  cover,
  city,
  addressLine,
  hoursSummary,
  phone,
  className,
}: ShowroomCardProps) {
  const rootClass = cn(CARD_BASE, href ? CARD_INTERACTIVE : null, className);
  const body = (
    <>
      <Aspect ratio="16/9" className={cn('bg-cream', CARD_IMAGE_ZOOM)}>
        {cover}
      </Aspect>
      <div className="flex flex-col gap-3 p-4 md:p-5">
        <h3 className="text-h4 font-bold text-balance line-clamp-1">{name}</h3>
        {(city || addressLine) && (
          <div className="flex flex-col gap-1 text-body">
            {city ? <span>{city}</span> : null}
            {addressLine ? (
              <span className="text-stone">{addressLine}</span>
            ) : null}
          </div>
        )}
        {hoursSummary ? (
          <p className="text-small text-stone">{hoursSummary}</p>
        ) : null}
        {phone ? (
          <div className="text-small">
            {href ? (
              <span className="text-charcoal">{phone.label}</span>
            ) : (
              <a
                href={`tel:${phone.e164}`}
                className="text-charcoal underline underline-offset-4 decoration-1 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory rounded-sm"
              >
                {phone.label}
              </a>
            )}
          </div>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={rootClass}>
        {body}
      </a>
    );
  }
  return <article className={rootClass}>{body}</article>;
}
