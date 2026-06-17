import Image from 'next/image';
import { GoldArrow } from '@zhic/ui';
import styles from './SeriesLinkCard.module.css';

export type SeriesLinkCardProps = {
  title: string;
  body: string;
  href: string;
  img: string;
  /** Photo on the physical right (story, Figma 261:189). Default = left (intro, 261:196). */
  flip?: boolean;
  /** Photo width as a % of the card. Intro ≈ 57, story ≈ 47. */
  imageWidthPct?: number;
  /** Override the link label («بیشتر بخوانید»). */
  cta?: string;
  /** Show the «بیشتر بخوانید →» link. Default true; off for the intro card. */
  showMore?: boolean;
};

/**
 * Editorial link card with a photo on one side and title + short body +
 * «بیشتر بخوانید →» on the other. Used for the intro card (photo left) and the
 * design-story card (photo right, `flip`). Figma 261:196 / 261:189.
 */
export function SeriesLinkCard({
  title,
  body,
  href,
  img,
  flip = false,
  imageWidthPct = 57,
  cta = 'بیشتر بخوانید',
  showMore = true,
}: SeriesLinkCardProps) {
  const photo = (
    <div className={styles.photo} style={{ width: `${imageWidthPct}%` }}>
      <Image src={img} alt={title} fill sizes="430px" className={styles.img} />
    </div>
  );
  const text = (
    <div className={styles.text}>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{body}</p>
      {showMore ? (
        <a className={styles.more} href={href}>
          <span>{cta}</span>
          <GoldArrow className={styles.arrow} />
        </a>
      ) : null}
    </div>
  );
  return (
    <section className={styles.card}>
      {/* RTL row: first child renders on the right. intro → [text, photo],
          story (flip) → [photo, text]. */}
      {flip ? photo : text}
      {flip ? text : photo}
    </section>
  );
}
