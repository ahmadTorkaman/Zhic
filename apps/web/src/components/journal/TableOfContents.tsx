'use client';

import { useEffect, useRef, useState } from 'react';
import type { HeadingEntry } from '@/lib/richtext';

export function TableOfContents({ headings }: { headings: HeadingEntry[] }) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-10% 0px -85% 0px' },
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="فهرست مطالب" className="hidden lg:block">
      <div className="sticky top-24">
        <p className="mb-3 text-eyebrow font-bold tracking-wide text-charcoal">
          فهرست مطالب
        </p>
        <ul className="flex flex-col gap-1 border-s border-sand">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={[
                  'block border-s-2 py-1 text-small transition-colors',
                  h.level === 3 ? 'ps-6' : 'ps-4',
                  activeId === h.id
                    ? 'border-accent font-bold text-charcoal'
                    : 'border-transparent text-stone hover:text-charcoal',
                ].join(' ')}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
