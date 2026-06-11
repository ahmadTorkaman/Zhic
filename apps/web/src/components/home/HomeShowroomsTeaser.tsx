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
      <Container>
        <BlurInText as="h2" className="zh-st__title">
          ما را در شهر خودتان ببینید
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
    </section>
  );
}
