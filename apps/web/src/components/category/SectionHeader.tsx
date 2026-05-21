import { FadeUp } from '@zhic/ui';
import Link from 'next/link';
import styles from './SectionHeader.module.css';

export type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  sub?: string;
  subHref?: string;
  first?: boolean;
};

export function SectionHeader({ eyebrow, title, sub, subHref, first }: SectionHeaderProps) {
  return (
    <FadeUp as="header" className={first ? `${styles.head} ${styles.first}` : styles.head}>
      <div>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {sub ? (
        subHref ? (
          <Link href={subHref} className={`${styles.sub} ${styles.subLink}`}>{sub}</Link>
        ) : (
          <span className={styles.sub}>{sub}</span>
        )
      ) : null}
    </FadeUp>
  );
}
