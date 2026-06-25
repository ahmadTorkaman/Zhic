import { BlurInText } from '@zhic/ui';
import styles from './JournalIntro.module.css';

/**
 * Journal intro headline (Figma 227:497). Default: forest-green concept words
 * with gold connectors (brand copy). When a `title` is provided (category/tag
 * name), it reveals word-by-word in uniform forest, matching the site-wide
 * blur-in. The default bicolor brand headline is decorative and stays static.
 */
export function JournalIntro({ title }: { title?: string }) {
  if (title) {
    return (
      <BlurInText as="p" className={`${styles.intro} ${styles.big}`}>
        {title}
      </BlurInText>
    );
  }
  return (
    <p className={styles.intro}>
      <span className={styles.big}>ایده‌ها</span>
      <span className={styles.small}> ، </span>
      <span className={styles.big}>راهنماها</span>
      <span className={styles.small}> و </span>
      <span className={styles.big}>ترندهای</span>
      <span className={styles.small}> دکوراسیون </span>
      <br />
      <span className={styles.small}>برای خانه‌ای که </span>
      <span className={styles.big}>دوستش</span>
      <span className={styles.small}> دارید</span>
    </p>
  );
}
