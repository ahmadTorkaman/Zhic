'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { NAV_LINKS, isNavActive } from './navLinks';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
};

export function MobileMenu({ open, onClose, pathname }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="منو"
      aria-hidden={!open}
      className={`fixed inset-0 z-[var(--z-overlay)] flex flex-col items-center justify-center gap-7 bg-ivory transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <button
        type="button"
        aria-label="بستن"
        onClick={onClose}
        className="absolute start-4 top-3 flex h-10 w-10 items-center justify-center text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink"
      >
        <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
        </svg>
      </button>

      <span className="text-h3 font-black text-charcoal">ژیک</span>

      <ul className="flex flex-col items-center gap-5">
        {NAV_LINKS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'text-h4 font-bold text-charcoal'
                    : 'text-h4 font-bold text-stone transition-colors duration-[var(--dur-hover)] hover:text-charcoal'
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
