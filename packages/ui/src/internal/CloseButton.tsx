import { cn } from '../cn';

export function CloseButton({
  onClick,
  label = 'بستن',
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
        'text-stone hover:bg-sand/60 hover:text-charcoal',
        'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        className,
      )}
    >
      <svg
        viewBox="0 0 14 14"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M1 1 L13 13 M13 1 L1 13" strokeLinecap="round" />
      </svg>
    </button>
  );
}
