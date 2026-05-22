import Link from 'next/link';
import type { PayloadDesign } from '@/lib/payload';
import { toPersianDigits } from '@zhic/locale';
import { SectionHeader } from './SectionHeader';
import styles from './DesignsWithType.module.css';

export type DesignsWithTypeProps = {
  designs: PayloadDesign[];
  /** "آینه دیواری" (leaf) or "آینه" (parent) — interpolated into the h2. */
  contextLabel: string;
  /** "این نوع در" (leaf) or "این دسته در" (parent). */
  eyebrow?: string;
};

export function DesignsWithType({
  designs,
  contextLabel,
  eyebrow = '★ این نوع در',
}: DesignsWithTypeProps) {
  if (!designs.length) return null;
  return (
    <>
      <SectionHeader
        eyebrow={eyebrow}
        title={`طرح‌هایی که ${contextLabel} دارند`}
        sub={`${toPersianDigits(designs.length)} طرح موجود`}
      />
      <div className={styles.row} aria-label="طرح‌های مرتبط">
        {designs.map((d) => (
          <Link key={d.slug} href={`/bedroom-set/${d.slug}`} className={styles.card}>
            <div
              className={styles.bg}
              style={{
                background: d.heroMedia?.url
                  ? `url("${d.heroMedia.url}") center/cover`
                  : `linear-gradient(160deg, #c8a878, #6f4e2e)`,
              }}
            />
            <div className={styles.scrim} />
            <div className={styles.meta}>
              <div className={styles.eye}>طرح</div>
              <div className={styles.nm}>{d.name}</div>
            </div>
            <div className={styles.arrow}>←</div>
          </Link>
        ))}
      </div>
    </>
  );
}
