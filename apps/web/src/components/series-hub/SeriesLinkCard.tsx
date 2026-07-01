'use client';

import * as React from 'react';
import Image from 'next/image';
import styles from './SeriesLinkCard.module.css';

export type SeriesLinkCardProps = {
  title: string;
  body: string;
  href: string;
  img: string;
  /** Photo on the physical right (story, Figma 261:189). Default = left (intro, 261:196). */
  flip?: boolean;
  /** Photo width as a % of the card. Intro ≈ 57, story ≈ 47. */
  imageWidthPct?: number;
  /** Override the expand label («بیشتر بخوانید»). */
  cta?: string;
  /** Allow the inline read-more toggle. Default true. */
  showMore?: boolean;
  /** Lines shown before the body is clamped. */
  clampLines?: number;
};

/**
 * Editorial link card with a photo on one side and title + body on the other.
 * The body is clamped to `clampLines` and reveals the rest inline via a minimal
 * «بیشتر بخوانید» toggle (the card grows when open) — no navigation, since the
 * card has no dedicated story page. Figma 261:196 / 261:189.
 */
export function SeriesLinkCard({
  title,
  body,
  img,
  flip = false,
  imageWidthPct = 57,
  cta = 'بیشتر بخوانید',
  showMore = true,
  clampLines = 3,
}: SeriesLinkCardProps) {
  const bodyRef = React.useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [overflowing, setOverflowing] = React.useState(false);

  // Detect whether the clamped body actually overflows (so the toggle only
  // appears when there's more to read). Re-measures on resize / copy change.
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollHeight - el.clientHeight > 1);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [body, clampLines, expanded]);

  const showToggle = showMore && (overflowing || expanded);

  const photo = (
    <div className={styles.photo} style={{ width: `${imageWidthPct}%` }}>
      <Image src={img} alt={title} fill sizes="430px" className={styles.img} />
    </div>
  );
  const text = (
    <div className={styles.text}>
      <p className={styles.title}>{title}</p>
      <p
        ref={bodyRef}
        className={`${styles.body}${expanded ? '' : ` ${styles.clamped}`}`}
        style={expanded ? undefined : { WebkitLineClamp: clampLines }}
      >
        {body}
      </p>
      {showToggle ? (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span>{expanded ? 'بستن' : cta}</span>
          <svg className={styles.chev} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9 L12 15 L18 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
  return (
    <section className={`${styles.card}${expanded ? ` ${styles.expanded}` : ''}`}>
      {/* RTL row: first child renders on the right. intro → [text, photo],
          story (flip) → [photo, text]. */}
      {flip ? photo : text}
      {flip ? text : photo}
    </section>
  );
}
