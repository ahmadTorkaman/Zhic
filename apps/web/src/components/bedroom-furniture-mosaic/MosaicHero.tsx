import { BlurInText } from '@zhic/ui';
import styles from './MosaicHero.module.css';

export type MosaicHeroProps = {
  /** Plain headline (used for aria + single-line render). */
  title: string;
  /** Optional explicit two-line split (comp root hero «مُبلمان / اتاق خواب»);
   *  omit for hub pages where the title is a single category name. */
  titleLines?: [string, string];
  subtitle?: string;
  tagline?: string;
};

/**
 * Bedroom-furniture mosaic hero (Figma Kaveh 334:136/143/151).
 * Text-only block on the cream page: Black dark-forest headline, gold Bold
 * subtitle, gold Regular tagline. Centered. No photo (unlike BedroomHero).
 * Renders a two-line title when `titleLines` is given, else a single line.
 */
export function MosaicHero({ title, titleLines, subtitle, tagline }: MosaicHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="bfm-hero-title">
      <h1 id="bfm-hero-title" className={styles.title} aria-label={title}>
        {titleLines ? (
          <>
            <span aria-hidden="true">
              <BlurInText>{titleLines[0]}</BlurInText>
            </span>
            <span aria-hidden="true">
              <BlurInText delay={90}>{titleLines[1]}</BlurInText>
            </span>
          </>
        ) : (
          <BlurInText>{title}</BlurInText>
        )}
      </h1>
      {subtitle ? (
        <BlurInText as="p" className={styles.subtitle} delay={140}>
          {subtitle}
        </BlurInText>
      ) : null}
      {tagline ? (
        <BlurInText as="p" className={styles.tagline} delay={220}>
          {tagline}
        </BlurInText>
      ) : null}
    </section>
  );
}
