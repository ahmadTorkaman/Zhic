'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Container, computeRowOffset } from '@zhic/ui';
import './home-journal-rows.css';

export type HomeJournalArticle = {
  slug: string;
  title: string;
  category: string;
  coverUrl: string;
};

export type HomeJournalRowsProps = {
  articles: HomeJournalArticle[];
  /** Heading text. */
  eyebrow?: string;
  heading?: string;
  lead?: string;
};

// Speed × direction per row (matches framer.university intent).
const SPEEDS = { 0: 0.35, 1: -0.55, 2: 0.75 } as const;
const MAX_DESKTOP = 300;
const MAX_PHONE = 140;

export function HomeJournalRows({
  articles,
  eyebrow = 'ژورنال ژیک',
  heading = 'از کارگاه، از همدان',
  lead = 'یادداشت‌هایی از پشت‌صحنه‌ی ساخت، انتخاب چوب، و طرح‌هایی که از سنت بلند ایران الهام گرفته‌اند.',
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
          <div className="zh-jrows__eyebrow">{eyebrow}</div>
          <h2 className="zh-jrows__heading">{heading}</h2>
          <p className="zh-jrows__lead">{lead}</p>
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
        <div className="zh-jrows__cta-row">
          <Link href="/journal" className="zh-jrows__cta">
            همه‌ی مقالات
            <span aria-hidden className="zh-jrows__arrow" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
