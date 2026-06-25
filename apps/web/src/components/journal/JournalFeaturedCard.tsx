import Image from 'next/image';
import { GoldArrow, BlurInText } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { JournalArticle } from '@/lib/journal-content';
import styles from './JournalFeaturedCard.module.css';

/** Small calendar-week glyph (Figma 227:480), gold via currentColor. */
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 9.87 10.16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M0.226 3.363H9.649M2.32 0.226V1.272M7.555 0.226V1.272M2.32 5.455H7.555V7.546H2.32V5.455ZM1.901 9.638H7.974C8.56 9.638 8.853 9.638 9.077 9.524C9.274 9.424 9.434 9.264 9.535 9.067C9.649 8.843 9.649 8.55 9.649 7.965V2.945C9.649 2.359 9.649 2.066 9.535 1.843C9.434 1.646 9.274 1.486 9.077 1.386C8.853 1.272 8.56 1.272 7.974 1.272H1.901C1.315 1.272 1.021 1.272 0.798 1.386C0.601 1.486 0.44 1.646 0.34 1.843C0.226 2.066 0.226 2.359 0.226 2.945V7.965C0.226 8.55 0.226 8.843 0.34 9.067C0.44 9.264 0.601 9.424 0.798 9.524C1.021 9.638 1.315 9.638 1.901 9.638Z"
        stroke="currentColor"
        strokeWidth="0.452"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Featured (lead) article card for the journal index (Figma 227:479).
 */
export function JournalFeaturedCard({ article }: { article: JournalArticle }) {
  return (
    <a href={article.href} className={styles.card} aria-label={article.title}>
      <Image src={article.img} alt="" fill priority sizes="(max-width: 480px) 100vw, 430px" className={styles.photo} />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <span className={styles.tag}>{article.category}</span>
        <BlurInText as="h2" className={styles.title}>
          {article.title}
        </BlurInText>
        {article.excerpt ? (
          <BlurInText as="p" className={styles.excerpt} delay={120}>
            {article.excerpt}
          </BlurInText>
        ) : null}

        <div className={styles.meta}>
          <span>
            <span className={styles.metaNum}>{toPersianDigits(article.readingMinutes)}</span> دقیقه مطالعه
          </span>
          {article.date ? (
            <>
              <span className={styles.sep} aria-hidden="true" />
              <CalendarIcon className={styles.cal} />
              <span>{article.date}</span>
            </>
          ) : null}
        </div>

        <span className={styles.read}>
          مطالعه مقاله
          <GoldArrow className={styles.readArrow} />
        </span>
      </div>
    </a>
  );
}
