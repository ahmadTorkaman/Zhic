'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from './cn';
import { Container } from './Container';
import { Drawer } from './Drawer';

export type NavItem = { label: string; href: string };

export type SiteHeaderProps = {
  navItems: NavItem[];
  brand?: { label?: ReactNode; href?: string };
  actions?: ReactNode;
  className?: string;
};

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  navItems,
  brand,
  actions,
  className,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const brandLabel = brand?.label ?? 'ژیک';
  const brandHref = brand?.href ?? '/';

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-[200] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out-soft)]',
          scrolled
            ? 'border-b border-sand bg-ivory/85 backdrop-blur'
            : 'border-b border-transparent bg-transparent',
          className,
        )}
      >
        <Container>
          <div className="flex items-center justify-between gap-6 py-4">
            <Link
              href={brandHref}
              className="rounded-sm text-h4 font-black tracking-tight text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            >
              {brandLabel}
            </Link>
            <nav
              aria-label="ناوبری اصلی"
              className="hidden items-center gap-7 md:flex"
            >
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-sm text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory',
                      active
                        ? 'text-charcoal'
                        : 'text-stone hover:text-charcoal',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              {actions}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="باز کردن منو"
                aria-expanded={menuOpen}
                aria-controls="site-nav-drawer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-charcoal hover:bg-sand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory md:hidden"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path
                    d="M2 4 H14 M2 8 H14 M2 12 H14"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </header>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="full">
        <nav
          id="site-nav-drawer"
          aria-label="ناوبری موبایل"
          className="flex h-full flex-col items-center justify-center gap-8"
        >
          <span className="text-h3 font-black text-charcoal">{brandLabel}</span>
          <ul className="flex flex-col items-center gap-5">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-sm text-h4 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory',
                      active
                        ? 'text-charcoal'
                        : 'text-stone hover:text-charcoal',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Drawer>
    </>
  );
}
