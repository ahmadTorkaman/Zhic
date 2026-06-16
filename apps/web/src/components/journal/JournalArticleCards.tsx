import Image from 'next/image';
import { GoldArrow } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { JournalArticle } from '@/lib/journal-content';
import styles from './JournalArticleCards.module.css';

/**
 * Paired editorial article cards (Figma 227:605–617). In RTL the first card is
 * on the right with its text panel on the right; the second mirrors to the left.
 */
export function JournalArticleCards({ cards }: { cards: JournalArticle[] }) {
  return (
    <div className={styles.cards}>
      {cards.map((a, i) => (
        <a key={a.key} href={a.href} className={styles.card} aria-label={a.title}>
          <Image src={a.img} alt="" fill sizes="(max-width: 480px) 48vw, 210px" />
          <div className={`${styles.panel} ${i === 0 ? styles.right : styles.left}`}>
            <span className={styles.cat}>{a.category}</span>
            <h3 className={styles.title}>{a.displayTitle ?? a.title}</h3>
            {a.excerpt ? <p className={styles.subtitle}>{a.excerpt}</p> : null}
            <span className={styles.meta}>
              {toPersianDigits(a.readingMinutes)} دقیقه مطالعه
              <GoldArrow className={styles.metaArrow} />
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
