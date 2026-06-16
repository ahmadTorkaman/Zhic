import Image from 'next/image';
import styles from './BedroomHero.module.css';

/** Small flanking chevron for the «مشاهده» CTA (comp vectors 191:240–243). */
function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 14" fill="none" aria-hidden="true" className={className}>
      <path d="M6.5 1L1.5 7l5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Bedroom-furniture page hero (Figma frame 191:207).
 * Full-bleed photo with a 73% scrim + caramel bottom-fade, white right-aligned
 * headline/sub/tagline, and a centered «مشاهده» call-to-action.
 */
export function BedroomHero() {
  return (
    <section className={styles.hero} aria-labelledby="bf-hero-title">
      <Image
        src="/bedroom-furniture/hero.jpg"
        alt="اتاق خواب چوبی ژیک با نورپردازی گرم"
        fill
        priority
        sizes="(max-width: 480px) 100vw, 480px"
        className={styles.photo}
      />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <h1 id="bf-hero-title" className={styles.title}>
          مُبلمان
          <br />
          اتاق خواب
        </h1>
        <p className={styles.subtitle}>از تخت خواب تا آینه و میز آرایش</p>
        <p className={styles.tagline}>همه چیز با طراحی منظم و کیفیت ساخت بالا</p>

        <a href="#bf-categories" className={styles.cta}>
          <Chevron className={styles.chev} />
          <span className={styles.ctaLabel}>مشاهده</span>
          <Chevron className={`${styles.chev} ${styles.chevFlip}`} />
        </a>
      </div>
    </section>
  );
}
