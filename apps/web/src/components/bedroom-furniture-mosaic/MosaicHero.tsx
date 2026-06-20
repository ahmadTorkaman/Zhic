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
            <span aria-hidden="true">{titleLines[0]}</span>
            <span aria-hidden="true">{titleLines[1]}</span>
          </>
        ) : (
          title
        )}
      </h1>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      {tagline ? <p className={styles.tagline}>{tagline}</p> : null}
    </section>
  );
}
