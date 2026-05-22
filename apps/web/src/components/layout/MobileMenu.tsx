'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { NAV_LINKS, isNavActive } from './navLinks';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
};

type Item = { label: string; href: string };

// Sets + Pieces are hardcoded here because SetsMegaMenu / PiecesMegaMenu
// own them on desktop and they don't live in NAV_LINKS. Order matches the
// previous MainView layout so the mobile and desktop nav read the same.
const ITEMS: Item[] = [
  { label: 'سرویس خواب', href: '/bedroom-set' },
  { label: 'مبلمان اتاق خواب', href: '/bedroom-furniture' },
  ...NAV_LINKS,
];

export function MobileMenu({ open, onClose, pathname }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Body scroll lock — keyed on `open`.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Esc dismisses. Flat — no sub-views to step back through.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Move focus into the dialog when it opens so keyboard / AT users
  // don't stay focused on the hamburger button behind the overlay.
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="منو"
      aria-hidden={!open}
      className={`fixed inset-0 z-[var(--z-overlay)] overflow-y-auto bg-ivory transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] motion-reduce:transition-none focus:outline-none ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <button
        type="button"
        aria-label="بستن"
        onClick={onClose}
        className="absolute start-4 top-3 z-10 flex h-10 w-10 items-center justify-center text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink"
      >
        <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
        </svg>
      </button>

      <div className="relative flex min-h-screen flex-col items-center gap-7 px-4 pb-10 pt-16">
        <span className="text-h3 font-black text-charcoal">ژیک</span>

        <ul aria-label="پیمایش اصلی" className="flex w-full max-w-[420px] flex-col gap-2.5">
          {ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-3 rounded-[14px] border border-sand bg-cream px-5 py-4 transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:bg-ivory"
                >
                  <span
                    className={`flex-1 text-[22px] font-black leading-[1.15] tracking-[-0.01em] ${
                      active ? 'text-forest' : 'text-charcoal'
                    }`}
                  >
                    {item.label}
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                    className={active ? 'text-forest' : 'text-stone'}
                  >
                    <path d="M11 3L5 8L11 13" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
