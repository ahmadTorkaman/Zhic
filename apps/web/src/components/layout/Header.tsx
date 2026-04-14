'use client';

import { useState, useEffect } from 'react';
import { NAV_LINKS } from '@/lib/constants';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
        scrolled ? 'glass' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between h-16 md:h-20">
        <a
          href="#"
          className="font-serif text-lg md:text-xl tracking-[0.35em] text-charcoal hover:text-accent transition-colors duration-300"
        >
          ZHIC
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative px-5 py-2 text-[11px] tracking-[0.15em] uppercase text-stone hover:text-charcoal transition-colors duration-300 group"
            >
              {link.label}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-accent transition-all duration-300 group-hover:w-4" />
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
