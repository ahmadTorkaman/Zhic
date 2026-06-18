import Image from 'next/image';
import type { HeroContent } from '@/lib/bedroom-furniture';
import styles from './BedroomHero.module.css';

/** Small downward chevron flanking the «مشاهده» CTA (comp vectors 191:240–243). */
function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 8" fill="none" aria-hidden="true" className={className}>
      <path d="M1 1.5L7 6.5L13 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Bedroom-furniture page hero (Figma frame 191:207).
 * Full-bleed photo with a 73% scrim + caramel bottom-fade, white right-aligned
 * headline/sub/tagline, and a centered «مشاهده» CTA. All copy/image default to
 * the comp values; pass `hero` (from the CMS) to override.
 */
export function BedroomHero({ hero }: { hero?: HeroContent }) {
  const titleLines = (hero?.title ?? 'مُبلمان\nاتاق خواب').split('\n').filter(Boolean);
  return (
    <section className={styles.hero} aria-labelledby="bf-hero-title">
      <Image
        src={hero?.img ?? '/bedroom-furniture/hero.jpg'}
        alt={hero?.imgAlt ?? 'اتاق خواب چوبی ژیک با نورپردازی گرم'}
        fill
        priority
        sizes="(max-width: 480px) 100vw, 480px"
        className={styles.photo}
      />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <h1 id="bf-hero-title" className={styles.title}>
          {titleLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < titleLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </h1>
        <p className={styles.subtitle}>{hero?.subtitle ?? 'از تخت خواب تا آینه و میز آرایش'}</p>
        <p className={styles.tagline}>{hero?.tagline ?? 'همه چیز با طراحی منظم و کیفیت ساخت بالا'}</p>

        <a href={hero?.ctaHref ?? '#bf-categories'} className={styles.cta}>
          <Chevron className={styles.chev} />
          <span className={styles.ctaLabel}>{hero?.ctaLabel ?? 'مشاهده'}</span>
          <Chevron className={styles.chev} />
        </a>
      </div>
    </section>
  );
}
