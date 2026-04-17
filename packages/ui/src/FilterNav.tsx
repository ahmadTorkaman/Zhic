import { cn } from './cn';

export type FilterNavItem = {
  value: string;
  label: string;
  href: string;
};

export type FilterNavProps = {
  items: FilterNavItem[];
  activeValue?: string;
  allHref?: string;
  allLabel?: string;
  label: string;
  className?: string;
};

function PillLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex shrink-0 snap-start items-center rounded-pill px-4 py-2',
        'text-small font-medium whitespace-nowrap',
        'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        active
          ? 'bg-charcoal text-ivory'
          : 'bg-cream text-charcoal hover:bg-sand',
      )}
    >
      {children}
    </a>
  );
}

export function FilterNav({
  items,
  activeValue,
  allHref,
  allLabel = 'همه',
  label,
  className,
}: FilterNavProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]',
        className,
      )}
    >
      <div className="flex gap-2 snap-x snap-mandatory">
        {allHref && (
          <PillLink href={allHref} active={!activeValue}>
            {allLabel}
          </PillLink>
        )}
        {items.map((item) => (
          <PillLink
            key={item.value}
            href={item.href}
            active={item.value === activeValue}
          >
            {item.label}
          </PillLink>
        ))}
      </div>
    </nav>
  );
}
