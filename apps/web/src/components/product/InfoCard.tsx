import type { ReactNode } from 'react';
import styles from './InfoCard.module.css';

export type InfoCardProps = {
  label: string;
  children: ReactNode;
  variant?: 'default' | 'forest';
};

export function InfoCard({ label, children, variant = 'default' }: InfoCardProps) {
  const cls =
    variant === 'forest'
      ? `glass-card ${styles.card} ${styles.forest}`
      : `glass-card ${styles.card}`;
  return (
    <div className={cls}>
      <div className={styles.lbl}>{label}</div>
      <div className={styles.val}>{children}</div>
    </div>
  );
}
