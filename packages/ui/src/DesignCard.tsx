import type { ReactNode } from 'react';
import { Aspect } from './Aspect';
import { Badge } from './Badge';
import { cn } from './cn';
import { CARD_BASE, CARD_INTERACTIVE, CARD_IMAGE_ZOOM } from './cardClasses';

export type DesignCardProps = {
  href?: string;
  name: ReactNode;
  image: ReactNode;
  ageGroupLabel?: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function DesignCard({
  href,
  name,
  image,
  ageGroupLabel,
  description,
  className,
}: DesignCardProps) {
  const rootClass = cn(CARD_BASE, href ? CARD_INTERACTIVE : null, className);
  const body = (
    <>
      <Aspect ratio="3/2" className={cn('bg-cream', CARD_IMAGE_ZOOM)}>
        {image}
      </Aspect>
      <div className="flex flex-col gap-3 p-4 md:p-5">
        {ageGroupLabel ? (
          <div>
            <Badge variant="neutral" size="sm" shape="rounded">
              {ageGroupLabel}
            </Badge>
          </div>
        ) : null}
        <h3 className="text-h4 font-bold text-balance line-clamp-1">{name}</h3>
        {description ? (
          <p className="text-body text-stone line-clamp-2">{description}</p>
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
