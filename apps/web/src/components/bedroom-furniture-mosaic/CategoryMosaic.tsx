import Image from 'next/image';
import type { MosaicRow, MosaicTile } from '@/lib/bedroom-furniture-mosaic';
import styles from './CategoryMosaic.module.css';

export type CategoryMosaicProps = {
  heading: string;
  rows: MosaicRow[];
};

/**
 * One mosaic tile: rounded photo + glass caption band.
 * Caption action by variant: wide → «مشاهده» + arrow · featured → lone arrow ·
 * pair (pill) → label only (operator: pills don't need «مشاهده»).
 */
function Tile({
  tile,
  variant,
  sizes,
}: {
  tile: MosaicTile;
  variant: 'featured' | 'wide' | 'pair';
  sizes: string;
}) {
  return (
    <a
      href={tile.href}
      className={`${styles.tile} ${styles[variant]}`}
      style={{ aspectRatio: tile.aspect }}
      aria-label={tile.name}
    >
      {tile.img ? (
        <Image
          src={tile.img}
          alt=""
          fill
          sizes={sizes}
          className={styles.photo}
          style={tile.pos ? { objectPosition: tile.pos } : undefined}
        />
      ) : (
        <span className={styles.fallback} aria-hidden="true" />
      )}
      {/* Frosted-glass caption band straddling the photo (comp bands
          334:114–120: rgba(0,0,0,.1) tint + background-blur). Label on the
          inline-start (right in RTL), «مشاهده» + arrow on the inline-end.
          backdrop-filter is set inline because the CSS-module pipeline
          (Lightning CSS) strips it — same approach as PiecesMegaMenu. */}
      <span
        className={styles.caption}
        aria-hidden="true"
        style={{
          backdropFilter: 'blur(9px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(9px) saturate(1.2)',
        }}
      >
        {/* Every tile: label only — no «مشاهده»/arrow (operator). */}
        {tile.comingSoon && (
          <span
            style={{
              display: 'block',
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              opacity: 0.75,
              marginBottom: '3px',
            }}
          >
            به‌زودی
          </span>
        )}
        <span className={styles.label}>{tile.display ?? tile.name}</span>
      </span>
    </a>
  );
}

/**
 * Category-mosaic grid (Figma Kaveh 334:105). A «دسته بندی محصولات» section
 * label (with flanking gold marks), then a fixed sequence of rows: a big
 * featured tile, alternating 2-col pairs and full-width wide tiles. Each tile
 * carries its exact comp aspect ratio. Props-driven — content comes from the
 * seed getter, so wiring Payload later touches only the data.
 */
export function CategoryMosaic({ heading, rows }: CategoryMosaicProps) {
  return (
    <section className={styles.section} aria-label={heading}>
      <div className={styles.heading}>
        <span className={styles.mark} aria-hidden="true" />
        <span className={styles.headingText}>{heading}</span>
        <span className={styles.mark} aria-hidden="true" />
      </div>

      <div className={styles.grid}>
        {rows.map((row, i) => {
          if (row.type === 'pair') {
            return (
              <div key={i} className={styles.pairRow}>
                <Tile tile={row.tiles[0]} variant="pair" sizes="(max-width: 430px) 44vw, 190px" />
                <Tile tile={row.tiles[1]} variant="pair" sizes="(max-width: 430px) 44vw, 190px" />
              </div>
            );
          }
          const featured = row.type === 'featured';
          return (
            <Tile
              key={i}
              tile={row.tile}
              variant={featured ? 'featured' : 'wide'}
              sizes="(max-width: 430px) 92vw, 400px"
            />
          );
        })}
      </div>
    </section>
  );
}
