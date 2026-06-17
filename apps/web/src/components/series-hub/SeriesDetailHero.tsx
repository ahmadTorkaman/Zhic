import Image from 'next/image';
import styles from './SeriesDetailHero.module.css';

export type SeriesDetailHeroProps = {
  img: string | null;
  alt: string;
  name: string;
  subtitle: string | null;
};

/**
 * Detail-page hero (Figma 261:151-154): full-bleed room photo with a cream
 * title card overlapping its bottom edge — centered «آیرون» + subtitle.
 */
export function SeriesDetailHero({ img, alt, name, subtitle }: SeriesDetailHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.photo}>
        {img ? (
          <Image src={img} alt={alt} fill sizes="430px" priority className={styles.img} />
        ) : null}
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>{name}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
    </section>
  );
}
