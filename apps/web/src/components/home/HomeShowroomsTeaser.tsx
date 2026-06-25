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

      {/* Figma Vector — full-width forest ribbon at the seam into the
          consultation section: tapered ends + a downward point at center.
          Shape from zh-dropdown.svg (fill comes from .zh-st__divider → --color-forest #5F7760 @ 0.88). */}
      <div className="zh-st__divider" aria-hidden>
        <svg viewBox="0 0 1828 79" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <path d="M1806.15 22C1793.65 34.5 1791.83 35 1780.65 35C1593.15 35 972.149 36.0014 967.649 36.002C940.468 36.0054 913.649 78.5 913.649 78.5C913.649 78.5 886.83 36.0054 859.649 36.002C855.149 36.0014 234.149 35.0001 46.6493 35.0001C35.4714 35.0001 33.6493 34.5001 21.1493 22.0001C8.64929 9.50006 -1.35059 -0.0116617 0.149292 4.48227e-05C1.64917 0.0117513 26.5601 22.0001 46.6493 22.0001L78.3077 22.0002C202.823 22.0008 656.148 22.003 859.649 22.0001C885.548 21.9997 913.649 68.0137 913.649 68.0137C913.649 68.0137 941.75 21.9996 967.649 22C1200.65 22.0034 1761.15 22 1780.65 22C1800.74 22 1825.65 0.0117173 1827.15 1.0794e-05C1828.65 -0.0116957 1818.65 9.50002 1806.15 22Z" />
        </svg>
      </div>
    </section>
  );
}
