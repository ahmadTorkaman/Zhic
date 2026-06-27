/**
 * Parent-category HUB content for the /bedroom-furniture/[slug] mosaic redesign.
 *
 * A hub page (a pure-parent category like `bed`, `table`, `mirror`) renders the
 * adaptive mosaic with one tile per CHILD category. Tiles are auto-photo'd from
 * a representative product in each child (operator decision: "auto from
 * products"); the hero title is the category name + a `tagline` (→ CMS
 * Categories.tagline / .description later).
 *
 * SEEDED here for the /lab preview with REAL tree data + locally-optimized
 * representative photos. The live route will build the same `HubContent` shape
 * from Payload (children + first product image + category.tagline), so wiring
 * is a 1:1 swap of `getHubContent`.
 */
import type { SimpleTile } from './bedroom-furniture-mosaic';
import type { PayloadCategory } from './payload';

export type HubContent = {
  slug: string;
  hero: { title: string; subtitle?: string; tagline?: string };
  /** Section label above the mosaic. */
  heading: string;
  /** Child categories, ordered featured-first (by product count desc). */
  tiles: SimpleTile[];
};

const HUB = '/bedroom-furniture-mosaic/hubs';

const SEED: Record<string, HubContent> = {
  // N=4 → featured + pair + wide
  bed: {
    slug: 'bed',
    hero: {
      title: 'تخت خواب',
      subtitle: 'قلبِ اتاق خواب، در هر اندازه',
      tagline: 'از نوزاد تا بزرگسال — یک‌نفره، دونفره و دوطبقه',
    },
    heading: 'دسته‌بندی تخت‌ها',
    tiles: [
      { key: 'single', name: 'تخت یک نفره', img: `${HUB}/single.jpg`, href: '/bedroom-furniture/bed/single' },
      { key: 'double', name: 'تخت دونفره', img: `${HUB}/double.jpg`, href: '/bedroom-furniture/bed/double' },
      { key: 'baby', name: 'تخت نوزاد', img: `${HUB}/convertible.jpg`, href: '/bedroom-furniture/bed/baby' },
      { key: 'bunk', name: 'تخت دوطبقه', img: `${HUB}/bunk.jpg`, href: '/bedroom-furniture/bed/bunk' },
    ],
  },

  // N=2 → featured + wide
  table: {
    slug: 'table',
    hero: {
      title: 'میز',
      subtitle: 'برای کار، مطالعه و آراستن',
      tagline: 'میز تحریر و میز آرایش',
    },
    heading: 'دسته‌بندی میزها',
    tiles: [
      { key: 'study-desk', name: 'میز تحریر', img: `${HUB}/study-desk.jpg`, href: '/bedroom-furniture/table/study-desk' },
      { key: 'vanity', name: 'میز آرایش', img: `${HUB}/vanity.jpg`, href: '/bedroom-furniture/table/vanity' },
    ],
  },

  // N=3 → featured + pair
  mirror: {
    slug: 'mirror',
    hero: {
      title: 'آینه',
      subtitle: 'بازتابِ آرامش',
      tagline: 'آینه‌ی قدی، دیواری و رومیزی',
    },
    heading: 'دسته‌بندی آینه‌ها',
    tiles: [
      { key: 'standing-mirror', name: 'آینه قدی', img: `${HUB}/standing-mirror.jpg`, href: '/bedroom-furniture/mirror/standing-mirror' },
      { key: 'console-vanity-mirror', name: 'آینه رومیزی', img: `${HUB}/cvm.jpg`, href: '/bedroom-furniture/mirror/console-vanity-mirror' },
      { key: 'wall-mirror', name: 'آینه دیواری', img: `${HUB}/wall-mirror.jpg`, href: '/bedroom-furniture/mirror/wall-mirror' },
    ],
  },

  // N=6 → featured + pair + wide + pair (= the comp rhythm); 2 children have no
  // products yet → sand fallback tiles (shows the empty-category handling).
  complement: {
    slug: 'complement',
    hero: {
      title: 'تجهیزات مکمل تخت',
      subtitle: 'هر آنچه تخت را کامل می‌کند',
      tagline: 'باکس، حفاظ، شلف و میز تعویض',
    },
    heading: 'دسته‌بندی تجهیزات',
    tiles: [
      { key: 'wall-shelf', name: 'شلف دیواری', img: `${HUB}/wall-shelf.jpg`, href: '/bedroom-furniture/complement/wall-shelf' },
      { key: 'changing-table', name: 'میز تعویض', img: `${HUB}/changing-table.jpg`, href: '/bedroom-furniture/complement/changing-table' },
      { key: 'bed-box', name: 'باکس تخت', img: `${HUB}/bed-box.jpg`, href: '/bedroom-furniture/complement/bed-box' },
      { key: 'changing-top', name: 'صفحه تعویض', img: `${HUB}/changing-top.jpg`, href: '/bedroom-furniture/complement/changing-top' },
      { key: 'bed-guard', name: 'حفاظ تخت', href: '/bedroom-furniture/complement/bed-guard' },
      { key: 'bed-jack', name: 'جک کفی تخت', href: '/bedroom-furniture/complement/bed-jack' },
    ],
  },
};

export async function getHubContent(slug: string): Promise<HubContent | null> {
  return SEED[slug] ?? null;
}

/**
 * Build live HubContent from Payload: one tile per child category, photo =
 * `mosaicTileImage` ?? `cover` ?? a representative product photo (`photos` map
 * from `fetchChildTilePhotos`); tile crop = `mosaicTilePosition` (top/center/
 * bottom → object-position), default center. Hero = category name +
 * tagline/description. Tiles are ordered photo-first so the featured (first)
 * tile always has an image. `basePath` is the parent's canonical path, e.g.
 * `/bedroom-furniture/bed`.
 */
export function hubContentFromPayload(
  category: PayloadCategory,
  children: PayloadCategory[],
  photos: Map<string, string>,
  basePath: string,
): HubContent {
  const POS = { top: '50% 0%', center: '50% 50%', bottom: '50% 100%' } as const;
  const tiles: SimpleTile[] = children.map((c) => ({
    key: c.slug,
    name: c.name,
    img: c.mosaicTileImage?.url ?? c.cover?.url ?? photos.get(c.slug) ?? undefined,
    pos: c.mosaicTilePosition ? POS[c.mosaicTilePosition] : undefined,
    href: `${basePath}/${c.slug}`,
  }));
  // featured-first: tiles with a photo before sand-fallback tiles (stable).
  tiles.sort((a, b) => (a.img ? 0 : 1) - (b.img ? 0 : 1));

  return {
    slug: category.slug,
    hero: {
      title: category.name,
      subtitle: category.tagline ?? undefined,
      tagline: category.description ?? undefined,
    },
    heading: 'دسته‌بندی محصولات',
    tiles,
  };
}

/** Hub slugs available in the seed (for the /lab preview to enumerate). */
export const SEEDED_HUB_SLUGS = Object.keys(SEED);
