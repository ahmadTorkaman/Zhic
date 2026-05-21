'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@zhic/ui';
import { NAV_LINKS, isNavActive } from './navLinks';
import { MobileMenu } from './MobileMenu';
import { SetsMegaMenu } from './SetsMegaMenu';
import { PiecesMegaMenu } from './PiecesMegaMenu';
import type { NavMeta } from '@/lib/payload';

export type SiteHeaderProps = {
  navMeta: NavMeta;
};

export function SiteHeader({ navMeta }: SiteHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Border layout differs between mobile pill (full border) and desktop bar (border-bottom only).
  // Match the layout in both states so chrome activation doesn't cause a height jump.
  const chromeClass = scrolled
    ? 'site-header-chrome'
    : 'bg-transparent border border-transparent md:border-x-0 md:border-t-0';

  // محصولات is removed from NAV_LINKS; SetsMegaMenu + PiecesMegaMenu own those entries.

  return (
    <>
      <header
        className={`fixed top-3 inset-x-3 z-[var(--z-header)] rounded-full py-2 md:top-0 md:inset-x-0 md:rounded-none md:py-4 transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] ${chromeClass}`}
      >
        <Container>
          {/*
           * 1fr / auto / 1fr grid — nav sits at mathematical center regardless
           * of how wide the brand or icons columns get.
           * Mobile:  [hamburger] | [brand] | [icons]
           * Desktop: [brand]     | [nav]   | [icons]
           * justify-self-start/center/end map to visual right/center/left in RTL.
           */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">

            {/* ── Column 1 ── brand/hamburger: justify-self-start (RTL = visual right) */}
            <div className="justify-self-start">
              {/* Mobile: hamburger button */}
              <button
                type="button"
                aria-label="منو"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink md:hidden"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M2 4H14M2 8H14M2 12H14" strokeLinecap="round" />
                </svg>
              </button>
              {/* Desktop: brand with forest underline */}
              <Link
                href="/"
                className="relative hidden text-h4 font-black text-charcoal transition-opacity duration-[var(--dur-hover)] hover:opacity-80 md:inline-block"
              >
                ژیک
                {/* forest underline — matches .pill-header .brand::after in mockup */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute [inset-inline:4px] -bottom-[3px] h-[2px] rounded-[1px] bg-forest"
                />
              </Link>
            </div>

            {/* ── Column 2 ── center column: justify-self-center */}
            {/* Mobile: brand centered. Desktop: nav centered. */}
            <div className="justify-self-center">
              {/* Mobile brand */}
              <Link
                href="/"
                className="text-body font-black text-charcoal transition-opacity duration-[var(--dur-hover)] hover:opacity-80 md:hidden"
              >
                ژیک
              </Link>
              {/* Desktop nav */}
              <nav aria-label="اصلی" className="hidden items-center gap-7 text-small text-stone md:flex">
                <SetsMegaMenu data={navMeta} pathname={pathname} />
                <PiecesMegaMenu data={navMeta} pathname={pathname} />
                {NAV_LINKS.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'border-b-[1.5px] border-forest pb-[2px] font-bold text-charcoal'
                          : 'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:text-charcoal'
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ── Column 3 ── icons (search + wishlist): justify-self-end (RTL = visual left) */}
            <div className="flex items-center gap-1 justify-self-end">
              {/* Search */}
              {/* TODO: wire to search modal — follow-up after categories ship */}
              <button
                type="button"
                aria-label="جستجو"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone transition-colors duration-[var(--dur-hover)] hover:bg-sand/40 hover:text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-[18px] w-[18px]"
                >
                  <circle cx="11" cy="11" r="7.5" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Wishlist heart */}
              {/* TODO: wire to wishlist — Package 2 */}
              <button
                type="button"
                aria-label="علاقه‌مندی‌ها"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone transition-colors duration-[var(--dur-hover)] hover:bg-sand/40 hover:text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-[18px] w-[18px]"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

          </div>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
    </>
  );
}
