import styles from './JournalIntro.module.css';

/**
 * Journal intro headline (Figma 227:497). Fixed editorial copy: forest-green
 * concept words emphasised, gold connector words between them.
 */
export function JournalIntro() {
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
