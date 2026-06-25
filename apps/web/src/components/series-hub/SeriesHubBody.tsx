import type { SeriesHubContent } from '@/lib/series-hub-content';
import { SeriesDetailHero } from './SeriesDetailHero';
import { SeriesLinkCard } from './SeriesLinkCard';
import { SeriesCollection } from './SeriesCollection';
import { SeriesMaterials } from './SeriesMaterials';
import { SeriesDesignDetails } from './SeriesDesignDetails';
import { SeriesSiblings } from './SeriesSiblings';
import styles from './SeriesHubBody.module.css';

/**
 * The full detail-page body (everything between the breadcrumb and the global
 * consultation CTA / footer), composed from the props-driven section
 * components. Sections render only when their content is present, so the shared
 * template degrades gracefully for designs without the rich seed. Figma 261:90.
 */
export function SeriesHubBody({ content }: { content: SeriesHubContent }) {
  const { hero, title, intro, collection, materials, details, story } = content;
  return (
    <div className={styles.body}>
      <SeriesDetailHero img={hero.img} alt={hero.alt} name={title.name} subtitle={title.subtitle} />

      {intro ? (
        <SeriesLinkCard title={intro.title} body={intro.body} href={intro.href} img={intro.img} imageWidthPct={57} showMore={false} />
      ) : null}

      {collection.items.length > 0 ? (
        <SeriesCollection heading={collection.heading} items={collection.items} />
      ) : null}

      {materials ? <SeriesMaterials heading={materials.heading} items={materials.items} /> : null}

      {details ? <SeriesDesignDetails heading={details.heading} items={details.items} /> : null}

      {story ? (
        <SeriesLinkCard title={story.title} body={story.body} href={story.href} img={story.img} flip imageWidthPct={47} />
      ) : null}

      <SeriesSiblings siblings={content.siblings} featured={content.featuredSibling} />
    </div>
  );
}
