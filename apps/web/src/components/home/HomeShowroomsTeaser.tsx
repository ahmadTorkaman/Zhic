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

/**
 * Figma "zhic wood .com" home showrooms section: one row of three full-bleed
 * city-illustration cards (city name overlaid bottom-start in white), with a
 * full-width «فهرست کامل» bar that expands the grid to every showroom.
 */
export function HomeShowroomsTeaser({ showrooms }: HomeShowroomsTeaserProps) {
  const [expanded, setExpanded] = useState(false);
  if (showrooms.length === 0) return null;
  const visible = expanded ? showrooms : showrooms.slice(0, 3);
  const canToggle = showrooms.length > 3;

  return (
    <section className="zh-st" aria-label="شوروم‌ها">
      <Container>
        <BlurInText as="h2" className="zh-st__title">
          ما را در شهر خودتان ببینید
        </BlurInText>

        <div className="zh-st__grid">
          {visible.map((s, i) => (
            <Link
              key={s.slug}
              href={`/showrooms/${s.slug}`}
              // Cards revealed by the expand enter with a small staggered rise.
              className={`zh-st__card${i >= 3 ? ' is-new' : ''}`}
              style={i >= 3 ? ({ '--zh-st-i': i - 3 } as React.CSSProperties) : undefined}
            >
              {s.coverUrl ? (
                <img
                  src={s.coverUrl}
                  alt={`شوروم ${s.city}`}
                  width={900}
                  height={1200}
                  loading={i < 3 ? undefined : 'lazy'}
                  className="zh-st__img"
                />
              ) : (
                <span className="zh-st__img zh-st__img--ph" aria-hidden />
              )}
              <span className="zh-st__city">{s.city}</span>
            </Link>
          ))}
        </div>

        {canToggle && (
          <button
            type="button"
            className="zh-st__expand"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'نمایش کمتر' : 'فهرست کامل'}
          </button>
        )}
      </Container>
    </section>
  );
}
