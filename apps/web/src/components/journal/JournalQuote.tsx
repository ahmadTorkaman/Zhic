import Image from 'next/image';
import styles from './JournalQuote.module.css';

/**
 * Editorial quote block (Figma 227:599–603). The text uses an explicit line
 * break to mirror the comp's two-line setting.
 */
export function JournalQuote({ quote }: { quote: string }) {
  return (
    <div className={styles.quote}>
      <span className={styles.mark} aria-hidden="true">
        “
      </span>
      <Image
        src="/journal/quote-plant.png"
        alt=""
        width={86}
        height={112}
        className={styles.plant}
      />
      <blockquote className={styles.card}>
        <p className={styles.text}>{quote}</p>
      </blockquote>
    </div>
  );
}
