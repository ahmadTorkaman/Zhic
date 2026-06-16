import Image from 'next/image';
import type { JournalContent } from '@/lib/journal-content';
import styles from './JournalProductCTA.module.css';

/**
 * Product CTA banner (Figma 227:602). Photo banner linking to the catalog;
 * heading on the right, pill on the left.
 */
export function JournalProductCTA({ cta }: { cta: JournalContent['productCta'] }) {
  return (
    <a href={cta.href} className={styles.cta} aria-label={cta.title}>
      <Image src={cta.img} alt="" fill sizes="(max-width: 480px) 100vw, 430px" className={styles.photo} />
      <div className={styles.scrim} aria-hidden="true" />
      <span className={styles.btn}>{cta.cta}</span>
      <h2 className={styles.title}>{cta.title}</h2>
    </a>
  );
}
