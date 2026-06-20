/**
 * Content for the /bedroom-furniture *mosaic* direction (Figma Kaveh 334:105).
 *
 * SEEDED for now — static data + local media under
 * /public/bedroom-furniture-mosaic. To wire Payload later, replace only the body
 * of `getBedroomFurnitureMosaicContent` with a CMS query that returns the same
 * shape (the components stay untouched). Mirrors PayloadCategory-ish fields
 * (name / display / img / href) so the map is 1:1.
 */

export type MosaicTile = {
  key: string;
  /** Plain occupancy/category word — accessible label + alt. */
  name: string;
  /** Exact comp display glyphs (kashida/diacritics); falls back to `name`. */
  display?: string;
  /** Cover photo; omit for an empty category → renders a sand fallback tile. */
  img?: string;
  href: string;
  /** CSS aspect-ratio (w / h) — exact per the comp tile box. */
  aspect: string;
  /** object-position for the cover crop (matches the comp's pan). */
  pos?: string;
  /** Photo-less design awaiting renders → show a «به‌زودی» badge (opt-in;
   *  empty /bedroom-furniture categories leave this unset). */
  comingSoon?: boolean;
};

export type MosaicRow =
  | { type: 'featured'; tile: MosaicTile }
  | { type: 'wide'; tile: MosaicTile }
  | { type: 'pair'; tiles: [MosaicTile, MosaicTile] };

export type BedroomFurnitureMosaicContent = {
  hero: {
    /** Two display lines for the Black headline. */
    titleLines: [string, string];
    /** Plain headline for aria. */
    title: string;
    subtitle: string;
    tagline: string;
  };
  /** Section label above the grid. */
  heading: string;
  rows: MosaicRow[];
};

const SEED: BedroomFurnitureMosaicContent = {
  hero: {
    titleLines: ['مُبلمان', 'اتاق خواب'],
    title: 'مبلمان اتاق خواب',
    subtitle: 'از تخت خواب تا آینه و میز آرایش',
    tagline: 'همه چیز با طراحی منظم و کیفیت ساخت بالا',
  },
  heading: 'دسته بندی محصولات',
  rows: [
    {
      type: 'featured',
      tile: {
        key: 'bed',
        name: 'تخت خواب',
        img: '/bedroom-furniture-mosaic/bed.jpg',
        href: '/bedroom-furniture/bed',
        aspect: '377 / 399',
        pos: '50% 63%',
      },
    },
    {
      // Ordered for RTL grid placement: first tile lands in the RIGHT column.
      // Comp 334:105 puts کتابخانه right / پاتختی left.
      type: 'pair',
      tiles: [
        {
          key: 'bookcase',
          name: 'کتابخانه',
          img: '/bedroom-furniture-mosaic/bookcase.jpg',
          href: '/bedroom-furniture/storage/bookcase',
          aspect: '178 / 283',
          pos: '52% 56%',
        },
        {
          key: 'nightstand',
          name: 'پاتختی',
          display: 'پا تختی',
          img: '/bedroom-furniture-mosaic/nightstand.jpg',
          href: '/bedroom-furniture/nightstand',
          aspect: '178 / 283',
          pos: '50% 50%',
        },
      ],
    },
    {
      type: 'wide',
      tile: {
        key: 'desk',
        name: 'میز تحریر',
        img: '/bedroom-furniture-mosaic/desk.jpg',
        href: '/bedroom-furniture/table/study-desk',
        aspect: '377 / 294',
        pos: '50% 53%',
      },
    },
    {
      // RTL order: first tile = RIGHT column. Comp puts دراور right / کمد left.
      type: 'pair',
      tiles: [
        {
          key: 'dresser',
          name: 'دراور',
          display: 'دِراور',
          // ⚠️ no dedicated live "dresser" category — best-guess; confirm before wiring live.
          img: '/bedroom-furniture-mosaic/dresser.jpg',
          href: '/bedroom-furniture/storage/dresser',
          aspect: '178 / 238',
          pos: '50% 50%',
        },
        {
          key: 'wardrobe',
          name: 'کمد',
          display: 'کُمـــد',
          img: '/bedroom-furniture-mosaic/wardrobe.jpg',
          href: '/bedroom-furniture/storage/wardrobe',
          aspect: '178 / 238',
          pos: '50% 50%',
        },
      ],
    },
    {
      type: 'wide',
      tile: {
        key: 'accessory',
        name: 'اکسسوری',
        img: '/bedroom-furniture-mosaic/accessory.jpg',
        href: '/bedroom-furniture/complement',
        aspect: '377 / 231',
        pos: '50% 54%',
      },
    },
  ],
};

/**
 * Returns the page content. Async so the Payload swap is seamless later
 * (e.g. `return mapCategoriesToMosaic(await fetchAllCategories())`).
 */
export async function getBedroomFurnitureMosaicContent(): Promise<BedroomFurnitureMosaicContent> {
  return SEED;
}

/* ────────────────────────────────────────────────────────────────────────
 * Adaptive rhythm engine — maps a variable list of category tiles onto the
 * comp's editorial featured/pair/wide rhythm. Reproduces the comp exactly at
 * N=6–7 and degrades cleanly for N=2–5:
 *   1 → featured · 2 → featured+wide · 3 → featured+pair ·
 *   4 → featured+pair+wide · 6 → featured+pair+wide+pair (= comp) ·
 *   7 → featured+pair+wide+pair+wide (= comp)
 * Used by the parent-hub pages (tiles = a category's children).
 * ──────────────────────────────────────────────────────────────────────── */

/** A tile without hand-tuned geometry — `buildMosaicRows` assigns the aspect. */
export type SimpleTile = {
  key: string;
  name: string;
  display?: string;
  /** Cover photo; omit for an empty category → renders a sand fallback tile. */
  img?: string;
  href: string;
  /** object-position for the cover crop (default center). */
  pos?: string;
  /** Photo-less design → «به‌زودی» badge on the tile. */
  comingSoon?: boolean;
};

// Per-variant aspect ratios from the comp; pairs/wides alternate tall↔short
// occurrence-by-occurrence for the comp's editorial variety.
// Featured is shorter than the comp's near-square (377/399) — real product
// photos sit on white, so a tall featured tile read as mostly empty space.
const ASPECT_FEATURED = '377 / 330';
const ASPECT_PAIR = ['178 / 283', '178 / 238'] as const;
const ASPECT_WIDE = ['377 / 294', '377 / 231'] as const;

function toTile(t: SimpleTile, aspect: string): MosaicTile {
  return { ...t, aspect, pos: t.pos ?? '50% 50%' };
}

/**
 * Build the adaptive row sequence from an ordered tile list (featured first).
 * `featuredFirst` already ordered by the caller (e.g. by product count desc).
 */
export function buildMosaicRows(tiles: SimpleTile[]): MosaicRow[] {
  const rows: MosaicRow[] = [];
  if (!tiles.length) return rows;

  rows.push({ type: 'featured', tile: toTile(tiles[0]!, ASPECT_FEATURED) });

  let i = 1;
  let step = 0; // alternates: even → try a pair, odd → a wide
  let pairN = 0;
  let wideN = 0;
  while (i < tiles.length) {
    const remaining = tiles.length - i;
    const wantPair = step % 2 === 0;
    if (wantPair && remaining >= 2) {
      const asp = ASPECT_PAIR[pairN++ % 2]!;
      rows.push({ type: 'pair', tiles: [toTile(tiles[i]!, asp), toTile(tiles[i + 1]!, asp)] });
      i += 2;
    } else {
      const asp = ASPECT_WIDE[wideN++ % 2]!;
      rows.push({ type: 'wide', tile: toTile(tiles[i]!, asp) });
      i += 1;
    }
    step++;
  }
  return rows;
}
