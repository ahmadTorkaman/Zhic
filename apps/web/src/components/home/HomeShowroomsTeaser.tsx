'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BlurInText, Container } from '@zhic/ui';
import './home-showrooms-teaser.css';

export type HomeShowroomCard = {
  slug: string;
  city: string;
  coverUrl: string | null;
  isCentral?: boolean;
};

export type HomeShowroomsTeaserProps = {
  showrooms: HomeShowroomCard[];
};

function Card({ s, eager }: { s: HomeShowroomCard; eager?: boolean }) {
  return (
    <Link href={`/showrooms/${s.slug}`} className="zh-st__card">
      {s.coverUrl ? (
        <img
          src={s.coverUrl}
          alt={`شعبه‌ی ${s.city}`}
          width={900}
          height={1200}
          loading={eager ? undefined : 'lazy'}
          className="zh-st__img"
        />
      ) : (
        <span className="zh-st__img zh-st__img--ph" aria-hidden />
      )}
      <span className="zh-st__city">{s.city}</span>
    </Link>
  );
}

/**
 * Figma "zhic wood .com" home showrooms section: rows of three full-bleed
 * city-illustration cards. The «فهرست کامل» bar slides DOWN as the hidden
 * rows unfold above it (grid-template-rows 0fr → 1fr curtain), then reads
 * «نمایش کمتر» to fold them back up.
 */
export function HomeShowroomsTeaser({ showrooms }: HomeShowroomsTeaserProps) {
  const [expanded, setExpanded] = useState(false);
  if (showrooms.length === 0) return null;
  const firstRow = showrooms.slice(0, 3);
  const rest = showrooms.slice(3);

  return (
    <section className="zh-st" aria-label="شعب">
      {/* Full-bleed dotted divider above the branches (Figma «sar barg»). */}
      <div className="zh-st__dots" aria-hidden />
      <Container>
        <BlurInText as="p" className="zh-st__eyebrow">نمایندگی‌ها</BlurInText>
        <BlurInText as="h2" className="zh-st__title">
          ما را در شهر خودتان ببینید
        </BlurInText>
        <BlurInText as="p" className="zh-st__lead">
          سرویس خواب ژیک را از نزدیک در شعب ما ببینید.
        </BlurInText>

        <div className="zh-st__grid">
          {firstRow.map((s) => (
            <Card key={s.slug} s={s} eager />
          ))}
        </div>

        {rest.length > 0 && (
          <>
            {/* Curtain: rows unfold and push the bar down slowly. All cards
                stay in the DOM (crawlable); inert blocks focus while folded. */}
            <div
              className={`zh-st__more${expanded ? ' is-open' : ''}`}
              inert={!expanded || undefined}
              aria-hidden={!expanded}
            >
              <div className="zh-st__more-inner">
                <div className="zh-st__grid zh-st__grid--more">
                  {rest.map((s) => (
                    <Card key={s.slug} s={s} />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="zh-st__expand"
              aria-expanded={expanded}
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? 'نمایش کمتر' : 'فهرست کامل'}
            </button>
          </>
        )}
      </Container>

      {/* Figma export Vector 6 — full-width forest ribbon at the seam into the
          consultation section: tapered ends + a downward point at center. */}
      <div className="zh-st__divider" aria-hidden>
        <svg viewBox="0 0 383 17" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0H382.528C382.528 0 380.748 1.98907 378.131 4.60625C375.514 7.22344 372.792 7.32813 372.792 7.32813C372.792 7.32813 201.523 7.32801 200.581 7.32813C194.89 7.32885 189.275 16.2262 189.275 16.2262C189.275 16.2262 184.2 7.32958 179.016 7.32813C177.341 7.32766 10.1981 7.32813 10.1981 7.32813C10.1981 7.32813 6.13138 6.26336 4.75494 4.94805C3.37851 3.63275 0 0 0 0Z" />
        </svg>
      </div>
    </section>
  );
}
