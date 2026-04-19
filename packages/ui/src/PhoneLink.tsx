import { classifyPhone } from '@zhic/locale';
import { cn } from './cn';

export type PhoneLinkProps = {
  /** Raw phone string (any format — will be classified + formatted for display). */
  raw: string;
  /** When true, renders as a styled inline span with no underline (for use inside link cards). */
  inline?: boolean;
  className?: string;
};

export function PhoneLink({ raw, inline, className }: PhoneLinkProps) {
  const c = classifyPhone(raw);
  if (!c) {
    return <span dir="ltr" className={cn('text-charcoal', className)}>{raw}</span>;
  }
  if (inline) {
    return <span dir="ltr" className={cn('text-charcoal', className)}>{c.display}</span>;
  }
  return (
    <a
      href={`tel:${c.e164}`}
      dir="ltr"
      className={cn(
        'text-charcoal underline underline-offset-4 decoration-1 hover:decoration-2 focus-visible:outline-none rounded-sm transition-all duration-[var(--dur-hover)]',
        className,
      )}
    >
      {c.display}
    </a>
  );
}
