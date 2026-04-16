import { classifyPhone, toPersianDigits } from '@zhic/locale';
import { cn } from './cn';

export type PhoneLinkProps = {
  raw: string;
  /**
   * When true, render as `<span>` instead of `<a tel:>`. Use this when the
   * PhoneLink sits inside another linked element (e.g. inside a card whose
   * whole surface is `<a href>`), since nested anchors are invalid HTML.
   */
  inline?: boolean;
  className?: string;
};

const ANCHOR_CLASSES = [
  'text-charcoal underline underline-offset-4 decoration-1',
  'hover:decoration-2',
  'focus-visible:outline-none rounded-sm',
].join(' ');

/**
 * Display Iranian phone numbers consistently across the storefront.
 * - Mobile and landline are auto-detected via @zhic/locale.classifyPhone.
 * - Display always uses Persian digits + canonical spacing.
 * - Anchor href uses E.164 (`tel:+98...`).
 * - Unrecognized inputs fall back to a Persian-digit pass-through with no anchor.
 */
export function PhoneLink({ raw, inline = false, className }: PhoneLinkProps) {
  const c = classifyPhone(raw);
  if (!c) {
    // Fallback: render whatever the value is in Persian digits, no link.
    return (
      <span className={cn('text-body', className)} dir="ltr">
        {toPersianDigits(raw)}
      </span>
    );
  }
  if (inline) {
    return (
      <span className={cn('text-charcoal', className)}>{c.display}</span>
    );
  }
  return (
    <a href={`tel:${c.e164}`} className={cn(ANCHOR_CLASSES, className)}>
      {c.display}
    </a>
  );
}
