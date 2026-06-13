'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlurInText, Container, computeRowOffset } from '@zhic/ui';
import './home-journal-rows.css';

export type HomeJournalArticle = {
  slug: string;
  title: string;
  category: string;
  coverUrl: string;
};

export type HomeJournalRowsProps = {
  articles: HomeJournalArticle[];
  /** Forest eyebrow above the heading (Figma «ژورنال ژیک»). */
  eyebrow?: string;
  /** Heading text. */
  heading?: string;
  lead?: string;
  /** "See all" link copy + target below the rows (Figma «همه ی مقالات»). */
  ctaText?: string;
  ctaHref?: string;
};

// Speed × direction per row (matches framer.university intent).
const SPEEDS = { 0: 0.35, 1: -0.55, 2: 0.75 } as const;
const MAX_DESKTOP = 300;
// Phone shift bumped from 140→240 so the parallax reads as actual movement
// instead of a tiny wiggle. With the padding-inline fix landing the cards at
// the true viewport edges, 240px is ~⅔ of a 360px viewport — plenty visible.
const MAX_PHONE = 240;

export function HomeJournalRows({
  articles,
  eyebrow = 'ژورنال ژیک',
  heading = 'راهنمای خرید و چیدمان اتاق خواب',
  lead = 'از انتخاب سرویس خواب تا چیدمان اتاق کودک و نوجوان؛ راهنماهایی که خرید را برای شما ساده می‌کنند.',
  ctaText = 'همه‌ی مقالات',
  ctaHref = '/journal',
}: HomeJournalRowsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const max = window.innerWidth < 768 ? MAX_PHONE : MAX_DESKTOP;
    let rafId: number | null = null;
    let ticking = false;

    const update = () => {
      const rect = section.getBoundingClientRect();
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const speed = SPEEDS[i as 0 | 1 | 2] ?? 0;
        const x = computeRowOffset(
          { rectTop: rect.top, sectionHeight: section.offsetHeight, viewportHeight: window.innerHeight },
          speed,
          max,
        );
        row.style.transform = `translateX(${x.toFixed(2)}px)`;
      });
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Distribute articles round-robin into 3 rows.
  const rows: HomeJournalArticle[][] = [[], [], []];
  articles.forEach((a, i) => rows[i % 3]!.push(a));

  return (
    <section ref={sectionRef} className="zh-jrows" aria-label="ژورنال">
      <Container>
        <div className="zh-jrows__head">
          <BlurInText as="p" className="zh-jrows__eyebrow">{eyebrow}</BlurInText>
          <BlurInText as="h2" className="zh-jrows__heading">{heading}</BlurInText>
          <BlurInText as="p" className="zh-jrows__lead">{lead}</BlurInText>
        </div>
      </Container>

      <div className="zh-jrows__rows">
        {rows.map((row, i) => (
          <div
            key={i}
            ref={(el) => { rowRefs.current[i] = el; }}
            className="zh-jrows__row"
            data-row={i}
          >
            {row.map((a) => (
              <Link key={a.slug} href={`/journal/${a.slug}`} className="zh-jrows__card">
                <div
                  className="zh-jrows__cover"
                  style={{ backgroundImage: `url(${a.coverUrl})` }}
                  aria-hidden
                />
                <div className="zh-jrows__cat">{a.category}</div>
                <div className="zh-jrows__title">{a.title}</div>
              </Link>
            ))}
          </div>
        ))}
      </div>

      <Container>
        <div className="zh-jrows__foot">
          <Link href={ctaHref} className="zh-jrows__cta">
            <span>{ctaText}</span>
            <svg className="zh-jrows__cta-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 6l-6 6 6 6" />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  );
}
