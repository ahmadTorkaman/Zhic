import { FadeUp } from '@zhic/ui';
import styles from './CategoryCallouts.module.css';

export type Callout = { num: string; lbl: string };

export type CategoryCalloutsProps = {
  callouts: Callout[];     // computed by the page (per leaf/parent rules — see spec §5.3)
  variant: 'leaf' | 'parent';
};

export function CategoryCallouts({ callouts, variant }: CategoryCalloutsProps) {
  if (!callouts.length) return null;
  return (
    <section
      className={variant === 'parent' ? `${styles.callouts} ${styles.parent}` : styles.callouts}
      aria-label="نمای کلی"
    >
      {callouts.map((c, i) => (
        <FadeUp key={`${c.lbl}-${i}`} delay={i * 90} className={styles.callout}>
          <div className={styles.num}>{c.num}</div>
          <div className={styles.lbl}>{c.lbl}</div>
        </FadeUp>
      ))}
    </section>
  );
}
