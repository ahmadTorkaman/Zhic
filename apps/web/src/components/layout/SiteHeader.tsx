'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@zhic/ui';
import { NAV_LINKS, isNavActive } from './navLinks';
import { MobileMenu } from './MobileMenu';
import { ProductsMegaMenu } from './ProductsMegaMenu';
import type { NavMeta } from '@/lib/payload';

export type SiteHeaderProps = {
  navMeta: NavMeta;
};

const PRODUCTS_HREF = '/products';

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

  // Desktop nav excludes محصولات because ProductsMegaMenu owns that entry.
  const desktopNavLinks = NAV_LINKS.filter((item) => item.href !== PRODUCTS_HREF);

  return (
    <>
      <header
        className={`fixed top-3 inset-x-3 z-[var(--z-header)] rounded-full py-2 md:top-0 md:inset-x-0 md:rounded-none md:py-4 transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] ${chromeClass}`}
      >
        <Container>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center md:flex md:justify-between">
            {/* Mobile: hamburger (start). Desktop: brand first. */}
            <button
              type="button"
              aria-label="منو"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-6 w-6 items-center justify-center justify-self-start text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink md:h-10 md:w-10 md:hidden"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M2 4H14M2 8H14M2 12H14" strokeLinecap="round" />
              </svg>
            </button>

            <Link
              href="/"
              className="justify-self-center text-body font-black text-charcoal transition-opacity duration-[var(--dur-hover)] hover:opacity-80 md:justify-self-auto md:text-h4"
            >
              ژیک
            </Link>

            <nav aria-label="اصلی" className="hidden items-center gap-7 text-small text-stone md:flex">
              <ProductsMegaMenu data={navMeta} pathname={pathname} />
              {desktopNavLinks.map((item) => {
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

            <span aria-hidden className="md:hidden" />
          </div>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} navMeta={navMeta} />
    </>
  );
}
