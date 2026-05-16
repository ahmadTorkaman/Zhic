'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { NAV_LINKS, isNavActive } from './navLinks';
import type { NavMeta } from '@/lib/payload';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
  navMeta: NavMeta;
};

type View = 'main' | 'products';

export function MobileMenu({ open, onClose, pathname, navMeta }: MobileMenuProps) {
  const [view, setView] = useState<View>('main');
  const productsViewId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset view + scroll lock — keyed on `open` only, so view transitions
  // inside the menu don't unlock-and-relock scroll.
  useEffect(() => {
    if (!open) {
      setView('main');
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Esc handler — hierarchical (products → main → dismiss). Needs `view`
  // and `onClose` in the dep array, so re-registers per transition; that's
  // cheap (just attach/detach event listener, no DOM effect).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (view === 'products') setView('main');
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, view, onClose]);

  // Move focus into the dialog when it opens so keyboard / AT users
  // don't stay focused on the hamburger button behind the overlay.
  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  const cornerLabel = view === 'main' ? 'بستن' : 'بازگشت';
  const cornerHandler = view === 'main' ? onClose : () => setView('main');

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="منو"
      aria-hidden={!open}
      className={`fixed inset-0 z-[var(--z-overlay)] overflow-y-auto bg-ivory transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] focus:outline-none ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <button
        type="button"
        aria-label={cornerLabel}
        onClick={cornerHandler}
        className="absolute start-4 top-3 z-10 flex h-10 w-10 items-center justify-center text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink"
      >
        {view === 'main' ? (
          <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M11 3L5 8L11 13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="relative min-h-screen pt-16">
        {/* `active` is gated on `open` so the absolute-positioned, invisible views
            don't capture pointer events across the viewport when the dialog is
            closed (pointer-events is NOT a CSS-inherited property, so the outer
            dialog's pointer-events:none doesn't propagate to inline-styled children). */}
        <MainView
          active={open && view === 'main'}
          pathname={pathname}
          productsViewId={productsViewId}
          onProductsClick={() => setView('products')}
          onLinkClick={onClose}
        />
        <ProductsView
          active={open && view === 'products'}
          id={productsViewId}
          navMeta={navMeta}
          onLinkClick={onClose}
        />
      </div>
    </div>
  );
}

// ─────────────────────────── Main view (flat 5-link list) ────────────────────────────

function MainView({
  active,
  pathname,
  productsViewId,
  onProductsClick,
  onLinkClick,
}: {
  active: boolean;
  pathname: string | null;
  productsViewId: string;
  onProductsClick: () => void;
  onLinkClick: () => void;
}) {
  return (
    <div
      aria-label="منوی اصلی"
      inert={!active}
      style={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      className="absolute inset-0 overflow-y-auto flex flex-col items-center gap-7 px-4 py-10 transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] motion-reduce:transition-none"
    >
      <span className="text-h3 font-black text-charcoal">ژیک</span>

      <ul className="flex flex-col items-center gap-5">
        <li>
          <button
            type="button"
            onClick={onProductsClick}
            aria-controls={productsViewId}
            className="text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink"
          >
            محصولات
          </button>
        </li>
        {NAV_LINKS.filter((item) => item.href !== '/products').map((item) => {
          const isActive = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onLinkClick}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
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

// ─────────────────────────── Products view (catalog hierarchy) ────────────────────────────

function ProductsView({
  active,
  id,
  navMeta,
  onLinkClick,
}: {
  active: boolean;
  id: string;
  navMeta: NavMeta;
  onLinkClick: () => void;
}) {
  return (
    <div
      id={id}
      aria-label="منوی محصولات"
      inert={!active}
      style={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      className="absolute inset-0 overflow-y-auto flex flex-col gap-6 px-4 py-10 transition-opacity duration-[var(--dur-dialog)] ease-[var(--ease-out-soft)] motion-reduce:transition-none"
    >
      <h2 className="text-center text-h3 font-black text-charcoal">محصولات</h2>

      <form
        action="/products"
        method="get"
        role="search"
        onSubmit={onLinkClick}
        className="mx-auto flex w-full max-w-[320px] items-center gap-2 rounded-full border border-sand bg-cream px-4 py-2.5 focus-within:border-forest focus-within:bg-ivory"
      >
        <span aria-hidden className="inline-flex text-stone">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          name="q"
          placeholder="جستجوی محصول…"
          aria-label="جستجو در محصولات"
          className="min-w-0 flex-1 bg-transparent text-body text-charcoal placeholder:text-stone focus:outline-none"
        />
      </form>

      <CategoriesSection items={navMeta.categories} onLinkClick={onLinkClick} />
      {navMeta.designs.length > 0 && <DesignsSection items={navMeta.designs} onLinkClick={onLinkClick} />}
      {navMeta.collections.length > 0 && <CollectionsSection items={navMeta.collections} onLinkClick={onLinkClick} />}

      <Link
        href="/products"
        onClick={onLinkClick}
        className="mt-2 self-center text-h4 font-bold text-charcoal underline underline-offset-4 transition-colors duration-[var(--dur-hover)] hover:text-forest"
      >
        ← تمامی محصولات
      </Link>
    </div>
  );
}

function CategoriesSection({
  items,
  onLinkClick,
}: {
  items: NavMeta['categories'];
  onLinkClick: () => void;
}) {
  return (
    <section aria-labelledby="mob-cats-h" className="flex flex-col gap-3">
      <h3 id="mob-cats-h" className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
        دسته‌بندی‌ها
      </h3>
      {items.length === 0 ? (
        <p className="text-body text-stone">هیچ دسته‌بندی پیدا نشد.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/products?cat=${encodeURIComponent(c.slug)}`}
                onClick={onLinkClick}
                className="block text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DesignsSection({
  items,
  onLinkClick,
}: {
  items: NavMeta['designs'];
  onLinkClick: () => void;
}) {
  return (
    <section aria-labelledby="mob-designs-h" className="flex flex-col gap-3">
      <h3 id="mob-designs-h" className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
        طرح‌ها
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((d) => (
          <li key={d.id}>
            <Link
              href={`/designs/${encodeURIComponent(d.slug)}`}
              onClick={onLinkClick}
              className="block text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
            >
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CollectionsSection({
  items,
  onLinkClick,
}: {
  items: NavMeta['collections'];
  onLinkClick: () => void;
}) {
  return (
    <section aria-labelledby="mob-cols-h" className="flex flex-col gap-3">
      <h3 id="mob-cols-h" className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">
        مجموعه‌ها
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/collections/${encodeURIComponent(c.slug)}`}
              onClick={onLinkClick}
              className="block text-h4 font-bold text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-forest"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
