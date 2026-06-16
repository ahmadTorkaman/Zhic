import styles from './JournalSectionHeading.module.css';

/**
 * Section heading + the notched forest underline (Figma 227:623 / 227:622).
 * The line spans the width with a small downward peak at center.
 */
export function JournalSectionHeading({ title }: { title: string }) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{title}</h2>
      <svg
        className={styles.line}
        viewBox="0 0 412.61 17.5022"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M412.61 0H0C0 0 1.91964 2.14549 4.74265 4.96849C7.56565 7.7915 10.5016 7.90441 10.5016 7.90441C10.5016 7.90441 195.239 7.90429 196.255 7.90441C202.394 7.90519 208.451 17.5022 208.451 17.5022C208.451 17.5022 213.925 7.90598 219.517 7.90441C221.324 7.90391 401.61 7.90441 401.61 7.90441C401.61 7.90441 405.997 6.75591 407.481 5.33717C408.966 3.91843 412.61 0 412.61 0Z"
          fill="currentColor"
          fillOpacity="0.88"
        />
      </svg>
    </div>
  );
}
