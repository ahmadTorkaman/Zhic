import styles from './JournalIntro.module.css';

/**
 * Journal intro headline (Figma 227:497). Default: forest-green concept words
 * with gold connectors (brand copy). When a CMS `title` is provided, it renders
 * that text uniformly (forest), splitting on newlines into lines.
 */
export function JournalIntro({ title }: { title?: string }) {
  if (title) {
    const lines = title.split('\n').filter(Boolean);
    return (
      <p className={styles.intro}>
        {lines.map((line, i) => (
          <span key={i} className={styles.big}>
            {line}
            {i < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
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
