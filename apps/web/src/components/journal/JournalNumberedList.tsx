import Image from 'next/image';
import { GoldArrow } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { JournalArticle } from '@/lib/journal-content';
import styles from './JournalNumberedList.module.css';

export type JournalNumberedListProps = {
  articles: JournalArticle[];
  /** First displayed numeral (featured article is #01). */
  startNumber?: number;
};

/**
 * Numbered top-article list (Figma 227:570) — featured is #01, these are 02..N.
 * Latin serif numerals (Crimson Text), gold.
 */
export function JournalNumberedList({ articles, startNumber = 2 }: JournalNumberedListProps) {
  return (
    <div className={styles.card}>
      {articles.map((a, i) => (
        <a key={a.key} href={a.href} className={styles.row}>
          <div className={styles.thumb}>
            <Image src={a.img} alt="" fill sizes="(max-width: 480px) 35vw, 150px" />
          </div>
          <div className={styles.body}>
            <span className={styles.cat}>{a.category}</span>
            <h3 className={styles.title}>{a.title}</h3>
            <span className={styles.meta}>
              {toPersianDigits(a.readingMinutes)} دقیقه مطالعه
              <GoldArrow className={styles.metaArrow} />
            </span>
          </div>
          <span className={styles.num}>{String(i + startNumber).padStart(2, '0')}</span>
        </a>
      ))}
    </div>
  );
}
