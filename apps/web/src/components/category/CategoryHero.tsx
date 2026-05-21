import { BlurInText } from '@zhic/ui';
import type { PayloadCategory } from '@/lib/payload';
import styles from './CategoryHero.module.css';

export type CategoryHeroProps = {
  category: PayloadCategory;
  /** Optional fallback cover URL (e.g., first product's first gallery image on leaves). */
  fallbackCoverUrl?: string | null;
};

export function CategoryHero({ category, fallbackCoverUrl }: CategoryHeroProps) {
  const isLeaf = category.parent != null && typeof category.parent === 'object';
  const parentName = isLeaf ? (category.parent as PayloadCategory).name : null;

  const coverUrl = category.cover?.url ?? fallbackCoverUrl ?? null;
  // Placeholder when no cover and no fallback: cream-to-sand gradient with «ژ» watermark.
  const placeholderBg =
    'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(20,17,15,0.55) 100%), ' +
    'radial-gradient(ellipse at 70% 20%, #d8c4a3 0%, #8b6f47 55%, #3e2f1f 100%)';
  const heroBg = coverUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(20,17,15,0.55) 100%), url("${coverUrl}")`
    : placeholderBg;

  return (
    <section className={styles.hero}>
      <div className={styles.heroImg} style={{ backgroundImage: heroBg }} aria-hidden />
      <div className={styles.text}>
        <BlurInText as="span" className={styles.eyebrow}>دسته‌بندی</BlurInText>
        {isLeaf && parentName ? (
          <BlurInText as="span" className={styles.eyebrow} delay={90}>{parentName}</BlurInText>
        ) : null}
        <BlurInText
          as="h1"
          className={`${styles.title} ${!isLeaf ? styles.titleParent : ''}`}
          delay={220}
        >
          {category.name}
        </BlurInText>
        {category.tagline ? (
          <BlurInText as="p" className={styles.tagline} delay={400}>
            {category.tagline}
          </BlurInText>
        ) : null}
      </div>
    </section>
  );
}
