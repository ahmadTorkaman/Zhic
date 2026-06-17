'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './BedroomRevealScene.module.css';

/**
 * Scroll choreography for the bedroom-furniture top: the hero pins (sticky)
 * while the CategoryShowcase card scrolls up over it and zooms to full-bleed
 * (side insets → 0, card corners → 0). Once the card has covered the hero the
 * sticky context ends and the page continues normally.
 *
 * Progress is read straight from the card wrapper's viewport position each
 * frame (rAF), so it scrubs exactly with the scroll and is easy to tune.
 */
export function BedroomRevealScene({ hero, showcase }: { hero: ReactNode; showcase: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Expansion runs over the last RANGE px of the card's rise: p=0 when the
    // wrapper top is RANGE below the viewport top, p=1 once it reaches the top.
    const RANGE = 170;
    const START_INSET = 11; // px side gutter at rest
    const START_RADIUS = 14; // px card corner at rest
    let raf = 0;

    const update = () => {
      raf = 0;
      const top = wrap.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (RANGE - top) / RANGE));
      // `spread` extends the card frame to full-bleed; the card adds matching
      // inner padding so the content (and the lorem text) keeps its width and
      // does NOT reflow as the card widens.
      const spread = (START_INSET * p).toFixed(2);
      const radius = (START_RADIUS * (1 - p)).toFixed(2);
      wrap.style.setProperty('--bf-spread', `${spread}px`);
      wrap.style.setProperty('--bf-card-radius', `${radius}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // «مشاهده» CTA (href="#bf-categories"): rather than jumping to the top of
    // the scene (the START of the reveal), smooth-scroll through the whole
    // reveal so the card animates out to its final full-bleed width with the
    // hero covered behind it. Scrubbing is driven by the scroll handler above,
    // so the zoom plays as the page scrolls.
    const scene = wrap.parentElement;
    const cta = scene?.querySelector<HTMLAnchorElement>('a[href="#bf-categories"]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onCtaClick = (e: Event) => {
      e.preventDefault();
      // Land where the wrapper top reaches the viewport top — the point where
      // --bf-spread maxes out and the card is at its final width.
      const target = Math.max(0, window.scrollY + wrap.getBoundingClientRect().top);
      window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    cta?.addEventListener('click', onCtaClick);

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cta?.removeEventListener('click', onCtaClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={styles.scene}>
      <div className={styles.heroScene}>
        <div className={styles.heroPin}>{hero}</div>
      </div>
      <div ref={wrapRef} className={styles.showcase} style={{ paddingLeft: '11px', paddingRight: '11px' }}>
        {showcase}
      </div>
    </div>
  );
}
