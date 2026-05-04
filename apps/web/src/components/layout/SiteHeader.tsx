'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@zhic/ui';
import { NAV_LINKS, isNavActive } from './navLinks';
import { MobileMenu } from './MobileMenu';

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const chromeClass = scrolled
    ? 'site-header-chrome'
    : 'bg-transparent border-b border-transparent';

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[var(--z-header)] py-2 md:py-4 transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] ${chromeClass}`}
      >
        <Container>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center md:flex md:justify-between">
            {/* Mobile: hamburger (start). Desktop: brand first. */}
            <button
              type="button"
              aria-label="منو"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center justify-self-start text-charcoal transition-colors duration-[var(--dur-hover)] hover:text-ink md:hidden"
            >
              <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
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

            {/* Mobile: empty 3rd column to balance the grid. Desktop: hidden. */}
            <span aria-hidden className="md:hidden" />
          </div>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
    </>
  );
}
